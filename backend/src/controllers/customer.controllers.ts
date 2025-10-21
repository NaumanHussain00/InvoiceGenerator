import { type Request, type Response } from "express";
import prisma from "../config/db.js";

export const getAllCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    return res.json(customers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const { name, firm, phone } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!firm || typeof firm !== "string" || !firm.trim()) {
    return res.status(400).json({ error: "firm is required" });
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return res.status(400).json({ error: "phone is required" });
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        firm: firm.trim(),
        phone: phone.trim(),
      },
    });
    return res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "invalid id" });

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    return res.json(customer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "invalid id" });

  const { name, firm, phone } = req.body;
  const data: Record<string, any> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (firm !== undefined)
    data.firm = firm === null ? null : String(firm).trim();
  if (phone !== undefined)
    data.phone = phone === null ? null : String(phone).trim();

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "no fields to update" });
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    const updated = await prisma.customer.update({ where: { id }, data });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "invalid id" });

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    await prisma.customer.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
