import { Router } from "express";

import {
  addInvoice,
  getInvoices,
  getCustomerInvoices,
  getInvoiceById,
  voidInvoice,
  generateInvoiceById,
  searchInvoices,
  updateInvoice,
} from "../controllers/invoice.controllers.js";

const router = Router();

// Description: Create a New Invoice Entry.
router.post("/", addInvoice);

// Description: Get All Invoices.
router.get("/", getInvoices);

// Description: Search Invoices with Filters.
router.get("/search", searchInvoices);

// Description: Get Invoices by Customer ID.
router.get("/customer/:customerId", getCustomerInvoices);

// Description: Get Invoice by ID.
router.get("/:id", getInvoiceById);

// Description: Update an Invoice by ID.
router.put("/:id", updateInvoice);

// Description: Void an Invoice by ID.
router.put("/void/:id", voidInvoice);

// Description: Generate Invoice by ID.
router.get("/invoice/generate/:id", generateInvoiceById);

export default router;
