import express, { Router } from "express";
import { type Request, type Response } from "express";

import {
  getAllCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controllers.js";

const router: Router = express.Router();

/**
 * GET /customers
 * Description: Return all customers.
 * Query: none
 * Responses:
 *   200: Array of customer objects
 *   500: Internal server error
 */
router.get("/", getAllCustomers);

/**
 * POST /customers
 * Description: Create a new customer.
 * Body (JSON): { name: string, firm: string, phone: string }
 * Responses:
 *   201: Created customer object
 *   400: Validation error (missing/invalid fields)
 *   500: Internal server error
 */
router.post("/", createCustomer);

/**
 * GET /customers/:id
 * Description: Get a single customer by ID.
 * Params:
 *   id: integer (path)
 * Responses:
 *   200: Customer object
 *   400: Invalid id
 *   404: Customer not found
 *   500: Internal server error
 */
router.get("/:id", getCustomerById);

/**
 * PUT /customers/:id
 * Description: Update an existing customer. Provide one or more fields to update.
 * Params:
 *   id: integer (path)
 * Body (JSON): any of { name?: string, firm?: string, phone?: string }
 * Responses:
 *   200: Updated customer object
 *   400: Invalid id or no fields to update
 *   404: Customer not found
 *   500: Internal server error
 */
router.put("/:id", updateCustomer);

/**
 * DELETE /customers/:id
 * Description: Delete a customer by ID.
 * Params:
 *   id: integer (path)
 * Responses:
 *   204: No content (deleted)
 *   400: Invalid id
 *   404: Customer not found
 *   500: Internal server error
 */
router.delete("/:id", deleteCustomer);

export default router;
