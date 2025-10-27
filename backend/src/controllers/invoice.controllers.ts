import { Request, response, Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

export async function addInvoice(req: Request, res: Response) {
  const {
    totalAmount,
    amountDiscount,
    percentDiscount,
    amountTax,
    percentTax,
    packaging,
    transportation,
    finalAmount,
    paidByCustomer,
    lineItems,
  } = req.body;

  const customerId = Number(req.params.customerId);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json(
        new ResponseEntity(null, "Customer Not Found", 404)
      );
    }

    const prevBalance = customer.balance;
    const remainingBalance = prevBalance + finalAmount - paidByCustomer;

    const invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          customerId,
          totalAmount,
          amountDiscount,
          percentDiscount,
          amountTax,
          percentTax,
          packaging,
          transportation,
          finalAmount,
          custPrevBalance: prevBalance,
          paidByCustomer,
          remainingBalance,
        },
      });

      // Update balance
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: remainingBalance },
      });

      // Line items
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item: any) => ({
          invoiceId: createdInvoice.id,
          productId: item.productId,
          productQuantity: item.productQuantity,
          productAmountDiscount: item.productAmountDiscount,
          productPercentDiscount: item.productPercentDiscount,
        })),
      });

      // Return full invoice with product included
      const fullInvoice = await tx.invoice.findUnique({
        where: { id: createdInvoice.id },
        include: {
          customer: true,
          lineItems: { include: { product: true } },
        },
      });

      return fullInvoice!;
    });

    return res.status(201).json(
      new ResponseEntity(invoice, "Invoice Created Successfully", 201)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(500).json(
      new ResponseEntity(null, error.message || "Failed to Create Invoice", 500)
    );
  }
}

export async function getInvoices(_req: Request, res: Response) {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        lineItems: { include: { product: true } },
      },
    });
    const response = new ResponseEntity(
      invoices,
      "Invoices Fetched Successfully",
      200
    );
    return res.status(200).json(response);
  } catch {
    const response = new ResponseEntity(null, "Failed to Fetch Invoices", 500);
    return res.status(500).json(response);
  }
}

export async function getCustomerInvoices(req: Request, res: Response) {
  const customerId = Number(req.params.customerId);
  if (!Number.isInteger(customerId)) {
    const response = new ResponseEntity(null, "Invalid CustomerID", 400);
    return res.status(400).json(response);
  }
  try {
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        lineItems: { include: { product: true } },
      },
    });
    const response = new ResponseEntity(
      invoices,
      "Customer Invoices Fetched Successfully",
      200
    );
    return res.status(200).json(response);
  } catch {
    const response = new ResponseEntity(
      null,
      "Failed to fetch customer invoices",
      500
    );
    return res.status(500).json(response);
  }
}

export async function getInvoiceById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid Invoice ID", 400);
    return res.status(400).json(response);
  }
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: { include: { product: true } },
      },
    });
    if (!invoice) {
      const response = new ResponseEntity(null, "Invoice Not Found", 404);
      return res.status(404).json(response);
    }
    const response = new ResponseEntity(
      invoice,
      "Invoice Fetched Successfully",
      200
    );
    return res.status(200).json(response);
  } catch {
    const response = new ResponseEntity(null, "Failed to fetch invoice", 500);
    return res.status(500).json(response);
  }
}

export async function voidInvoice(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId)) {
    return res.status(400).json(
      new ResponseEntity(null, "Invalid Invoice ID", 400)
    );
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        lineItems: { include: { product: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json(
        new ResponseEntity(null, "Invoice Not Found", 404)
      );
    }

    if (invoice.status === "VOID") {
      return res.status(400).json(
        new ResponseEntity(null, "Invoice is Already Voided", 400)
      );
    }

    const updatedBalance = invoice.custPrevBalance;

    const voidedInvoice = await prisma.$transaction(async (tx) => {
      // ✅ Update invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "VOID" },
      });

      // ✅ Reset customer balance
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { balance: updatedBalance },
      });

      // ✅ Return fully populated invoice
      const fullInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          lineItems: { include: { product: true } },
        },
      });

      return fullInvoice!;
    });

    return res.status(200).json(
      new ResponseEntity(voidedInvoice, "Invoice Voided Successfully", 200)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(500).json(
      new ResponseEntity(null, error.message || "Failed to Void Invoice", 500)
    );
  }
}


