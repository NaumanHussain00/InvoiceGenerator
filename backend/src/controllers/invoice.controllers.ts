import { Request, Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

export async function addInvoice(req: Request, res: Response) {
  const {
    customerId,
    totalAmount,
    amountDiscount,
    percentDiscount,
    // percentTax,
    // packaging,
    // transportation,
    finalAmount,
    paidByCustomer,
    invoiceLineItems,
    taxLineItems,
    packagingLineItems,
    transportationLineItems,
  } = req.body;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Customer Not Found", 404));
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
          // percentTax,
          // packaging,
          // transportation,
          finalAmount,
          custPrevBalance: prevBalance,
          paidByCustomer,
          remainingBalance,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { balance: remainingBalance },
      });

      // ✅ Correct: singular model names
      if (invoiceLineItems?.length) {
        await tx.invoiceLineItem.createMany({
          data: invoiceLineItems.map((item: any) => ({
            invoiceId: createdInvoice.id,
            productId: item.productId,
            productQuantity: item.productQuantity,
            productAmountDiscount: item.productAmountDiscount,
            productPercentDiscount: item.productPercentDiscount,
          })),
        });
      }

      if (taxLineItems?.length) {
        await tx.taxLineItem.createMany({
          data: taxLineItems.map((tax: any) => ({
            invoiceId: createdInvoice.id,
            name: tax.name,
            percent: tax.percent,
            amount: tax.amount, 
          })),
        });
      }

      if (packagingLineItems?.length) {
        await tx.packagingLineItem.createMany({
          data: packagingLineItems.map((p: any) => ({
            invoiceId: createdInvoice.id,
            name: p.name,
            amount: p.amount,
          })),
        });
      }

      if (transportationLineItems?.length) {
        await tx.transportationLineItem.createMany({
          data: transportationLineItems.map((t: any) => ({
            invoiceId: createdInvoice.id,
            name: t.name,
            amount: t.amount,
          })),
        });
      }

      const fullInvoice = await tx.invoice.findUnique({
        where: { id: createdInvoice.id },
        include: {
          customer: true,
          invoiceLineItems: { include: { product: true } },
          taxLineItems: true,
          packagingLineItems: true,
          transportationLineItems: true,
        },
      });

      return fullInvoice!;
    });

    return res
      .status(201)
      .json(new ResponseEntity(invoice, "Invoice Created Successfully", 201));
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ResponseEntity(
          null,
          error.message || "Failed to Create Invoice",
          500
        )
      );
  }
}


// ✅ Get all invoices
export async function getInvoices(_req: Request, res: Response) {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        invoiceLineItems: { include: { product: true } },
        taxLineItems: true,
        packagingLineItems: true,
        transportationLineItems: true,
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

// ✅ Get invoices for specific customer
export async function getCustomerInvoices(req: Request, res: Response) {
  const customerId = Number(req.params.customerId);
  if (!Number.isInteger(customerId)) {
    return res
      .status(400)
      .json(new ResponseEntity(null, "Invalid Customer ID", 400));
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        invoiceLineItems: { include: { product: true } },
        taxLineItems: true,
        packagingLineItems: true,
        transportationLineItems: true,
      },
    });

    const response = new ResponseEntity(
      invoices,
      "Customer Invoices Fetched Successfully",
      200
    );
    return res.status(200).json(response);
  } catch {
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to fetch customer invoices", 500));
  }
}

// ✅ Get single invoice by ID
export async function getInvoiceById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res
      .status(400)
      .json(new ResponseEntity(null, "Invalid Invoice ID", 400));
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        invoiceLineItems: { include: { product: true } },
        taxLineItems: true,
        packagingLineItems: true,
        transportationLineItems: true,
      },
    });

    if (!invoice) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Invoice Not Found", 404));
    }

    return res
      .status(200)
      .json(new ResponseEntity(invoice, "Invoice Fetched Successfully", 200));
  } catch {
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to fetch invoice", 500));
  }
}

// ✅ Void invoice
export async function voidInvoice(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId)) {
    return res
      .status(400)
      .json(new ResponseEntity(null, "Invalid Invoice ID", 400));
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        invoiceLineItems: { include: { product: true } },
      },
    });

    if (!invoice) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Invoice Not Found", 404));
    }

    if (invoice.status === "VOID") {
      return res
        .status(400)
        .json(new ResponseEntity(null, "Invoice is Already Voided", 400));
    }

    const updatedBalance = invoice.custPrevBalance;

    const voidedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "VOID" },
      });

      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { balance: updatedBalance },
      });

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          invoiceLineItems: { include: { product: true } },
        },
      });
    });

    return res
      .status(200)
      .json(
        new ResponseEntity(voidedInvoice, "Invoice Voided Successfully", 200)
      );
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ResponseEntity(null, error.message || "Failed to Void Invoice", 500)
      );
  }
}
