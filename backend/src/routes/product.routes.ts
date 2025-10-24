import express, { Router } from "express";
import { type Request, type Response } from "express";

import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controllers.js";

const router: Router = express.Router();

// Description: Return all products.
router.get("/", getAllProducts);

// Description: Create a new product.
router.post("/", createProduct);

// Description: Get a single product by ID.
router.get("/:id", getProductById);

// Description: Update an existing product. Provide one or more fields to update.
router.put("/:id", updateProduct);

// Description: Delete a product by ID.
router.delete("/:id", deleteProduct);

export default router;
