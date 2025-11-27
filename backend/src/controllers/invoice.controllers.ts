import { Request, Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

export async function addInvoice(req: Request, res: Response) {
  console.log("Request Body:", req.body); // Debugging line
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
    console.log("Created Invoice:", invoice); // Debugging line
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

// ✅ Search invoices with filters
export async function searchInvoices(req: Request, res: Response) {
  const { invoiceId, phone, customerName, dateFrom, dateTo } = req.query;

  console.log("Search request received:", {
    invoiceId,
    phone,
    customerName,
    dateFrom,
    dateTo,
  });

  try {
    const where: any = {};

    // Filter by invoice ID
    if (invoiceId) {
      const id = Number(invoiceId);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json(
            new ResponseEntity(
              null,
              "Invoice ID must be a positive integer",
              400
            )
          );
      }
      where.id = id;
    }

    // Filter by customer phone or name (SQLite compatible)
    if (phone || customerName) {
      where.customer = {};
      if (phone) {
        where.customer.phone = { contains: String(phone) };
      }
      if (customerName) {
        // SQLite doesn't support mode: 'insensitive', so remove it
        where.customer.name = { contains: String(customerName) };
      }
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const fromDate = new Date(String(dateFrom));
        if (isNaN(fromDate.getTime())) {
          return res
            .status(400)
            .json(
              new ResponseEntity(
                null,
                "Invalid dateFrom format. Use YYYY-MM-DD",
                400
              )
            );
        }
        where.createdAt.gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(String(dateTo));
        if (isNaN(toDate.getTime())) {
          return res
            .status(400)
            .json(
              new ResponseEntity(
                null,
                "Invalid dateTo format. Use YYYY-MM-DD",
                400
              )
            );
        }
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    console.log("Search where clause:", JSON.stringify(where, null, 2));

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        invoiceLineItems: { include: { product: true } },
        taxLineItems: true,
        packagingLineItems: true,
        transportationLineItems: true,
      },
    });

    console.log(`Found ${invoices.length} invoices`);

    return res
      .status(200)
      .json(new ResponseEntity(invoices, "Invoices Search Results", 200));
  } catch (error: any) {
    console.error("Search error:", error);
    return res
      .status(500)
      .json(
        new ResponseEntity(
          null,
          error.message || "Failed to Search Invoices",
          500
        )
      );
  }
}

// ✅ Update invoice
export async function updateInvoice(req: Request, res: Response) {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId)) {
    return res
      .status(400)
      .json(new ResponseEntity(null, "Invalid Invoice ID", 400));
  }

  const {
    totalAmount,
    amountDiscount,
    percentDiscount,
    finalAmount,
    paidByCustomer,
    invoiceLineItems,
    taxLineItems,
    packagingLineItems,
    transportationLineItems,
  } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Invoice Not Found", 404));
    }

    if (invoice.status === "VOID") {
      return res
        .status(400)
        .json(new ResponseEntity(null, "Cannot Update Voided Invoice", 400));
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Update invoice basic fields
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          totalAmount: totalAmount ?? invoice.totalAmount,
          amountDiscount: amountDiscount ?? invoice.amountDiscount,
          percentDiscount: percentDiscount ?? invoice.percentDiscount,
          finalAmount: finalAmount ?? invoice.finalAmount,
          paidByCustomer: paidByCustomer ?? invoice.paidByCustomer,
          remainingBalance:
            invoice.custPrevBalance +
            (finalAmount ?? invoice.finalAmount) -
            (paidByCustomer ?? invoice.paidByCustomer),
        },
      });

      // Update customer balance
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { balance: updated.remainingBalance },
      });

      // Update line items if provided
      if (invoiceLineItems) {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
        if (invoiceLineItems.length) {
          await tx.invoiceLineItem.createMany({
            data: invoiceLineItems.map((item: any) => ({
              invoiceId,
              productId: item.productId,
              productQuantity: item.productQuantity,
              productAmountDiscount: item.productAmountDiscount,
              productPercentDiscount: item.productPercentDiscount,
            })),
          });
        }
      }

      if (taxLineItems) {
        await tx.taxLineItem.deleteMany({ where: { invoiceId } });
        if (taxLineItems.length) {
          await tx.taxLineItem.createMany({
            data: taxLineItems.map((tax: any) => ({
              invoiceId,
              name: tax.name,
              percent: tax.percent,
              amount: tax.amount,
            })),
          });
        }
      }

      if (packagingLineItems) {
        await tx.packagingLineItem.deleteMany({ where: { invoiceId } });
        if (packagingLineItems.length) {
          await tx.packagingLineItem.createMany({
            data: packagingLineItems.map((item: any) => ({
              invoiceId,
              name: item.name,
              amount: item.amount,
            })),
          });
        }
      }

      if (transportationLineItems) {
        await tx.transportationLineItem.deleteMany({ where: { invoiceId } });
        if (transportationLineItems.length) {
          await tx.transportationLineItem.createMany({
            data: transportationLineItems.map((item: any) => ({
              invoiceId,
              name: item.name,
              amount: item.amount,
            })),
          });
        }
      }

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          invoiceLineItems: { include: { product: true } },
          taxLineItems: true,
          packagingLineItems: true,
          transportationLineItems: true,
        },
      });
    });

    return res
      .status(200)
      .json(
        new ResponseEntity(updatedInvoice, "Invoice Updated Successfully", 200)
      );
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ResponseEntity(
          null,
          error.message || "Failed to Update Invoice",
          500
        )
      );
  }
}

// ✅ Generate Invoice by ID
export async function generateInvoiceById(req: Request, res: Response) {
  console.log("Generating invoice for ID:", req.params.id);
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

    // ---------- HTML TEMPLATE GENERATION ----------

    const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

    const productRows = invoice.invoiceLineItems
      .map((item) => {
        const rate = item.product?.price || 0;
        const qty = item.productQuantity;
        const percentDiscount = item.productPercentDiscount || 0;
        const amountDiscount = item.productAmountDiscount || 0;
        const totalBeforeDiscount = rate * qty;
        const totalDiscount =
          amountDiscount > 0
            ? amountDiscount
            : (totalBeforeDiscount * percentDiscount) / 100;
        const amountAfterDiscount = totalBeforeDiscount - totalDiscount;

        return `
          <tr>
            <td>${item.product?.name || "Unnamed Product"}</td>
            <td>${formatCurrency(rate)}</td>
            <td>${qty}</td>
            <td>${formatCurrency(totalDiscount)}</td>
            <td>${formatCurrency(amountAfterDiscount)}</td>
          </tr>`;
      })
      .join("");

    // Calculate discount display values
    let discountPercent: number;
    let discountAmount: number;

    if ((invoice.amountDiscount || 0) > 0) {
      discountAmount = invoice.amountDiscount || 0;
      discountPercent =
        ((invoice.amountDiscount || 0) / invoice.totalAmount) * 100;
    } else if ((invoice.percentDiscount || 0) > 0) {
      discountPercent = invoice.percentDiscount || 0;
      discountAmount =
        (invoice.totalAmount * (invoice.percentDiscount || 0)) / 100;
    } else {
      discountPercent = 0;
      discountAmount = 0;
    }

    const taxRows = invoice.taxLineItems
      .map((tax) => {
        // Calculate subtotal after discount (amount on which tax should be calculated)
        const subtotalAfterDiscount = invoice.totalAmount - discountAmount;

        let displayPercent: number;
        let displayAmount: number;

        // If amount is provided (non-zero), calculate percent from amount
        // Otherwise if percent is provided, calculate amount from percent
        if (tax.amount > 0) {
          displayAmount = tax.amount;
          displayPercent = (tax.amount / subtotalAfterDiscount) * 100;
        } else if (tax.percent > 0) {
          displayPercent = tax.percent;
          displayAmount = (subtotalAfterDiscount * tax.percent) / 100;
        } else {
          // Both are zero - shouldn't happen but handle gracefully
          displayPercent = 0;
          displayAmount = 0;
        }

        return `
        <tr>
          <td>Tax: ${tax.name}</td>
          <td></td><td></td>
          <td>${displayPercent.toFixed(2)}%</td>
          <td>${formatCurrency(displayAmount)}</td>
        </tr>`;
      })
      .join("");

    const packagingRows = invoice.packagingLineItems
      .map(
        (p) => `
        <tr>
          <td>Packaging: ${p.name}</td>
          <td></td><td></td><td></td>
          <td>${formatCurrency(p.amount)}</td>
        </tr>`
      )
      .join("");

    const transportationRows = invoice.transportationLineItems
      .map(
        (t) => `
        <tr>
          <td>Transport: ${t.name}</td>
          <td></td><td></td><td></td>
          <td>${formatCurrency(t.amount)}</td>
        </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #222;
        margin: 0;
        padding: 0;
      }
      .invoice-box {
        width: 210mm;
        min-height: 297mm;
        margin: auto;
        padding: 20mm;
        box-sizing: border-box;
        border: 1px solid #eee;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        line-height: 24px;
        font-size: 14px;
        background: white;
      }
      @media print {
        .invoice-box {
          box-shadow: none;
          border: none;
        }
      }
      .title {
        font-size: 45px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
      }
      .company-details {
        text-align: right;
        line-height: 18px;
      }
      .details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .details div {
        width: 48%;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        table-layout: fixed;
      }
      table th {
        border-bottom: 2px solid #4B00FF;
        text-align: left;
        padding: 10px 0;
        color: #4B00FF;
        text-transform: uppercase;
        font-size: 13px;
      }
      table td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      colgroup col:nth-child(1) { width: 45%; }
      colgroup col:nth-child(2),
      colgroup col:nth-child(3),
      colgroup col:nth-child(4),
      colgroup col:nth-child(5) { width: 13.75%; }
      .totals {
        margin-top: 30px;
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .totals td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .totals .total {
        font-weight: bold;
        font-size: 16px;
        border-top: 2px solid #000;
      }
      .highlight {
        color: #4B00FF;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header">
        <div>
          <div class="title">Invoice</div>
        </div>
        <div class="company-details">
          <strong>YOUR COMPANY</strong><br />
          1234 Your Street<br />
          City, California 90210<br />
          United States<br />
          1-888-123-4567
        </div>
      </div>

      <div class="details">
        <div>
          <strong>Billed To</strong><br />
          Customer ID: ${invoice.customer.id}<br />
          ${invoice.customer.name}<br />
          ${invoice.customer.firm || "No Firm"}<br />
          ${invoice.customer.address || "No Address"}<br />
        </div>
        <div>
          <table style="width: 100%;">
            <tr><td>Date Issued:</td><td>${invoice.createdAt.toLocaleDateString()}</td></tr>
            <tr><td>Invoice Number:</td><td>INV-${invoice.id
              .toString()
              .padStart(4, "0")}</td></tr>
            <tr><td><strong>Remaining Balance:</strong></td><td><strong>${formatCurrency(
              invoice.remainingBalance
            )}</strong></td></tr>
          </table>
        </div>
      </div>

      <table>
        <colgroup><col /><col /><col /><col /><col /></colgroup>
        <tr>
          <th>PRODUCTS</th><th>RATE</th><th>QTY</th><th>DISCOUNT</th><th>AMOUNT</th>
        </tr>
        ${productRows}
      </table>

      <table class="totals">
        <colgroup><col /><col /><col /><col /><col /></colgroup>
        <tr><td>Subtotal</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.totalAmount
        )}</td></tr>
        <tr><td>Discount</td><td></td><td></td><td>${discountPercent.toFixed(
          2
        )}%</td><td>${formatCurrency(discountAmount)}</td></tr>
        ${taxRows}
        ${packagingRows}
        ${transportationRows}
        <tr class="total"><td>Total</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.finalAmount
        )}</td></tr>
        <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.paidByCustomer
        )}</td></tr>
        <tr class="highlight"><td>Remaining Balance</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.remainingBalance
        )}</td></tr>
      </table>
    </div>
  </body>
</html>`;

    return res.status(200).send(html);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ResponseEntity(
          null,
          error.message || "Failed to Generate Invoice",
          500
        )
      );
  }
}
