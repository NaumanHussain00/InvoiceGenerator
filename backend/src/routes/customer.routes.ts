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

// Description: Return all customers.
router.get("/", getAllCustomers);

// Description: Create a new customer.
router.post("/", createCustomer);

// Description: Get a single customer by ID.
router.get("/:id", getCustomerById);

// Description: Update an existing customer. Provide one or more fields to update.
router.put("/:id", updateCustomer);

// Description: Delete a customer by ID.
router.delete("/:id", deleteCustomer);

export default router;
