import { Request, Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

// Get All Credits (with Customer info)
export const getAllCredits = async (_req: Request, res: Response) => {
  try {
    const credits = await prisma.credit.findMany({
      include: { customer: true }, // include full customer details
    });
    return res
      .status(200)
      .json(new ResponseEntity(credits, "Credits retrieved successfully", 200));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to retrieve credits", 500));
  }
};

// Create Credit (update field name)
export const createCredit = async (req: Request, res: Response) => {
  console.log("Creating credit with data:", req.body);
  const { customerId } = req.params;
  const { amountPaidByCustomer } = req.body;

  try {
    const customerIdInt = parseInt(customerId, 10);

    const customer = await prisma.customer.findUnique({
      where: { id: customerIdInt },
      select: { balance: true },
    });

    if (!customer) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Customer not found", 404));
    }

    const finalBalance = customer.balance - amountPaidByCustomer;

    const credit = await prisma.$transaction(async (prisma) => {
      await prisma.customer.update({
        where: { id: customerIdInt },
        data: { balance: finalBalance },
      });

      return prisma.credit.create({
        data: {
          customerId: customerIdInt,
          previousBalance: customer.balance,
          amountPaidByCustomer: amountPaidByCustomer,
          finalBalance,
        },
        include: { customer: true }, // include full customer info in response
      });
    });

    return res
      .status(201)
      .json(new ResponseEntity(credit, "Credit created successfully", 201));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to create credit", 500));
  }
};

// Get Credits by Customer ID (with Customer info)
export const getCreditsByCustomerId = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  try {
    const credits = await prisma.credit.findMany({
      where: { customerId: parseInt(customerId, 10) },
      include: { customer: true },
    });
    return res
      .status(200)
      .json(new ResponseEntity(credits, "Credits retrieved successfully", 200));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to retrieve credits", 500));
  }
};

// Get Credit by ID (with Customer info)
export const getCreditById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const credit = await prisma.credit.findUnique({
      where: { id: parseInt(id, 10) },
      include: { customer: true },
    });
    if (!credit) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Credit not found", 404));
    }
    return res
      .status(200)
      .json(new ResponseEntity(credit, "Credit retrieved successfully", 200));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to retrieve credit", 500));
  }
};

// Void Credit by ID
export const voidCreditById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const creditIdInt = parseInt(id, 10);
    const credit = await prisma.credit.findUnique({
      where: { id: creditIdInt },
      include: { customer: true },
    });
    if (!credit) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Credit not Found", 404));
    }

    if(credit.status == 'VOID'){
      const response = new ResponseEntity(credit, "Credit Already Voided", 400);
      return res
        .status(400)
        .json(response); 
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.customer.update({
        where: { id: credit.customerId },
        data: { balance: credit.previousBalance },
      });
      await prisma.credit.update({
        where: { id: creditIdInt },
        data: { status: "VOID" },
      });
    });
    const response = new ResponseEntity(credit, "Credit Voided Successfully", 200);
    return res
      .status(200)
      .json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to Void Credit", 500));
  }
};

export const generateCredit = async (req: Request, res: Response) => {
  console.log("Generating credit for ID:", req.params.creditId);
  const { creditId } = req.params;

  try {
    const creditIdInt = parseInt(creditId, 10);

    // 1️⃣ Fetch credit + customer
    const credit = await prisma.credit.findUnique({
      where: { id: creditIdInt },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            // businessName: true,
            // address: true,
            // city: true,
            // state: true,
          },
        },
      },
    });

    if (!credit) {
      return res
        .status(404)
        .json(new ResponseEntity(null, "Credit not found", 404));
    }

    const { previousBalance, amountPaidByCustomer, finalBalance, customer } =
      credit;

    // 2️⃣ Generate Credit Note HTML (same design as invoice)
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Credit Note</title>
        <style>
          @page { size: A4; margin: 0; }
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
          .title {
            font-size: 45px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4B00FF;
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
              <div class="title">Credit Note</div>
              <div style="font-size: 18px;">Credit ID: ${credit.id}</div>
              <div>Date Issued: ${new Date(credit.createdAt).toLocaleDateString()}</div>
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
              ${customer.name}<br />
             
            </div>

            <div>
              <table style="width: 100%;">
                <tr><td>Customer ID:</td><td>${customer.id}</td></tr>
                <tr><td>Status:</td><td>${credit.status}</td></tr>
              </table>
            </div>
          </div>

          <table class="totals">
            <tr><td>Previous Balance</td><td></td><td></td><td></td><td>₹${previousBalance.toFixed(2)}</td></tr>
            <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>₹${amountPaidByCustomer.toFixed(2)}</td></tr>
            <tr class="highlight"><td>New Balance</td><td></td><td></td><td></td><td>₹${finalBalance.toFixed(2)}</td></tr>
          </table>
        </div>
      </body>
    </html>
    `;

    // 3️⃣ Respond with the generated HTML
    return res
      .status(200)
      .send(html);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Failed to generate Credit Note HTML", 500));
  }
};



