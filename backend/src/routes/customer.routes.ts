import express, { Router } from "express";

import {
  getAllCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerHistory,
} from "../controllers/customer.controllers.js";

const router: Router = express.Router();

// Description: Return all customers.
router.get("/", getAllCustomers);

// Description: Get customer ledger (all customers with outstanding balances).
router.get("/ledger", getCustomerLedger);

// Description: Get customer transaction history (invoices and credits).
router.get("/history/:customerId", getCustomerHistory);

// Description: Create a new customer.
router.post("/", createCustomer);

// Description: Get a single customer by ID.
router.get("/:id", getCustomerById);

// Description: Update an existing customer. Provide one or more fields to update.
router.put("/:id", updateCustomer);

// Description: Delete a customer by ID.
router.delete("/:id", deleteCustomer);

export default router;
