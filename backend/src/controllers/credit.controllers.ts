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


