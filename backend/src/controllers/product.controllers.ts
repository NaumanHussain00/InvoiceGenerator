import { type Request, type Response } from "express";
import prisma from "../config/db.js";
import ResponseEntity from "../utils/ResponseEntity.js";

// Get All Products
export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    const response = new ResponseEntity(
      products,
      "Products retrieved successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Create a New Product
export const createProduct = async (req: Request, res: Response) => {
  const { name, subCategory, price } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || !name.trim()) {
    const response = new ResponseEntity(null, "Name is Required", 400);
    return res.status(400).json(response);
  }
  if (
    price === undefined ||
    price === null ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    const response = new ResponseEntity(
      null,
      "Price is Required and must be a non-negative number",
      400
    );
    return res.status(400).json(response);
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
      },
    });

    const response = new ResponseEntity(
      product,
      "Product Created Successfully",
      201
    );
    return res.status(201).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Get Product by ID
export const getProductById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      const response = new ResponseEntity(null, "Product not Found", 404);
      return res.status(404).json(response);
    }

    const response = new ResponseEntity(
      product,
      "Product Retrieved Successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  const { name, price } = req.body;
  const data: Record<string, any> = {};

  if (name !== undefined) data.name = String(name).trim();
  if (price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      const response = new ResponseEntity(
        null,
        "Price must be a non-negative number",
        400
      );
      return res.status(400).json(response);
    }
    data.price = priceNum;
  }

  if (Object.keys(data).length === 0) {
    const response = new ResponseEntity(null, "No Fields to Update", 400);
    return res.status(400).json(response);
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      const response = new ResponseEntity(null, "Product not Found", 404);
      return res.status(404).json(response);
    }

    const updated = await prisma.product.update({ where: { id }, data });
    const response = new ResponseEntity(
      updated,
      "Product Updated Successfully",
      200
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const response = new ResponseEntity(null, "Internal Server Error", 500);
    return res.status(500).json(response);
  }
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const response = new ResponseEntity(null, "Invalid ID", 400);
    return res.status(400).json(response);
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      const response = new ResponseEntity(null, "Product Not Found", 404);
      return res.status(404).json(response);
    }

    // Check if product is used in any invoices
    const usageCount = await prisma.invoiceLineItem.count({
      where: { productId: id },
    });

    if (usageCount > 0) {
      const response = new ResponseEntity(
        null,
        `Cannot delete product because it is used in ${usageCount} invoice(s).`,
        400
      );
      return res.status(400).json(response);
    }

    const deletedProduct = await prisma.product.delete({ where: { id } });
    const response = new ResponseEntity(
      deletedProduct,
      "Product Deleted Successfully",
      200 // Return 200 to send back the deleted object
    );
    return res.status(200).json(response);
  } catch (err: any) {
    console.error(err);
    const response = new ResponseEntity(null, `Internal Server Error: ${err.message}`, 500);
    return res.status(500).json(response);
  }
};
