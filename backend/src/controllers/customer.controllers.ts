import { type Request, type Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

// Get All Customers
export const getAllCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    const response = new ResponseEntity(
      customers,
      "Customers retrieved successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal server error", 500);
    return res.status(500).json(response);
  }
};

// Create a New Customer
export const createCustomer = async (req: Request, res: Response) => {
  const { name, phone, firm, address, balance } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || !name.trim()) {
    const response = new ResponseEntity(null, "Name is Required", 400);
    return res.status(400).json(response);
  }
  if (!firm || typeof firm !== "string" || !firm.trim()) {
    const response = new ResponseEntity(null, "Firm is Required", 400);
    return res.status(400).json(response);
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    const response = new ResponseEntity(null, "Phone is Required", 400);
    return res.status(400).json(response);
  }
  if (balance === undefined || typeof balance !== "number") {
    const response = new ResponseEntity(null, "Balance is Required", 400);
    return res.status(400).json(response);
  }

  try {
    // Check if phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone: phone.trim() },
    });

    if (existingCustomer) {
      const response = new ResponseEntity(
        existingCustomer,
        `Customer with Phone Number ${phone.trim()} Already Exists: ${
          existingCustomer.name
        }`,
        409
      );

      return res.status(409).json(response);
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        firm: firm.trim(),
        phone: phone.trim(),
        address: address ? address.trim() : "",
        balance,
      },
    });

    const response = new ResponseEntity(
      customer,
      "Customer Created Successfully",
      201
    );
    return res.status(201).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Get Customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      const response = new ResponseEntity(null, "Customer not Found", 404);
      return res.status(404).json(response);
    }

    const response = new ResponseEntity(
      customer,
      "Customer Retrieved Successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Update Customer
export const updateCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  const { name, firm, phone, balance } = req.body;
  const data: Record<string, any> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (firm !== undefined)
    data.firm = firm === null ? null : String(firm).trim();
  if (phone !== undefined)
    data.phone = phone === null ? null : String(phone).trim();
  if (balance !== undefined) data.balance = Number(balance);

  if (Object.keys(data).length === 0) {
    const response = new ResponseEntity(null, "No Fields to Update", 400);
    return res.status(400).json(response);
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      const response = new ResponseEntity(null, "Customer not Found", 404);
      return res.status(404).json(response);
    }

    const updated = await prisma.customer.update({ where: { id }, data });
    const response = new ResponseEntity(
      updated,
      "Customer Updated Successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Delete Customer
export const deleteCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      const response = new ResponseEntity(null, "Customer Not Found", 404);
      return res.status(404).json(response);
    }

    const deletedCustomer = await prisma.customer.delete({ where: { id } });
    const response = new ResponseEntity(
      deletedCustomer,
      "Customer Deleted Successfully",
      204
    );
    return res.status(204).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Get Customer Ledger (all customers with outstanding balances)
export const getCustomerLedger = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        balance: {
          not: 0,
        },
      },
      orderBy: {
        balance: "desc",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        firm: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalOwed = customers.reduce(
      (sum, customer) => sum + customer.balance,
      0
    );

    return res.status(200).json(
      new ResponseEntity(
        {
          customers,
          totalOwed,
          customerCount: customers.length,
        },
        "Customer Ledger Retrieved Successfully",
        200
      )
    );
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Internal Server Error", 500));
  }
};

// Get Customer History (all invoices and credits for a customer)
export const getCustomerHistory = async (req: Request, res: Response) => {
  const customerId = Number(req.params.customerId);

  if (!Number.isInteger(customerId)) {
    const response = new ResponseEntity(null, "Invalid Customer ID", 400);
    return res.status(400).json(response);
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      const response = new ResponseEntity(null, "Customer not Found", 404);
      return res.status(404).json(response);
    }

    // Get all invoices for this customer
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalAmount: true,
        amountDiscount: true,
        percentDiscount: true,
        finalAmount: true,
        custPrevBalance: true,
        paidByCustomer: true,
        remainingBalance: true,
        status: true,
        createdAt: true,
      },
    });

    // Get all credits for this customer
    const credits = await prisma.credit.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        previousBalance: true,
        amountPaidByCustomer: true,
        finalBalance: true,
        status: true,
        createdAt: true,
      },
    });

    // Combine and sort by date
    const transactions = [
      ...invoices.map((inv) => ({
        type: "invoice",
        id: inv.id,
        date: inv.createdAt,
        amount: inv.finalAmount,
        paid: inv.paidByCustomer,
        previousBalance: inv.custPrevBalance,
        newBalance: inv.remainingBalance,
        status: inv.status,
        details: inv,
      })),
      ...credits.map((cred) => ({
        type: "credit",
        id: cred.id,
        date: cred.createdAt,
        amount: 0,
        paid: cred.amountPaidByCustomer,
        previousBalance: cred.previousBalance,
        newBalance: cred.finalBalance,
        status: cred.status,
        details: cred,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json(
      new ResponseEntity(
        {
          customer,
          transactions,
          totalInvoices: invoices.length,
          totalCredits: credits.length,
        },
        "Customer History Retrieved Successfully",
        200
      )
    );
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(new ResponseEntity(null, "Internal Server Error", 500));
  }
};
