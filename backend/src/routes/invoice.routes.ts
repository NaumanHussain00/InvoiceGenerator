import { Router } from "express";

import {
    addInvoice,
    getInvoices,
    getCustomerInvoices,
    getInvoiceById,
    voidInvoice,
} from "../controllers/invoice.controllers.js";

const router = Router();

// Description: Create a New Invoice Entry.
router.post("/", addInvoice);

// Description: Get All Invoices.
router.get("/", getInvoices);

// Description: Get Invoices by Customer ID.
router.get("/customer/:customerId", getCustomerInvoices);

// Description: Get Invoice by ID.
router.get("/:id", getInvoiceById);

// Description: Void an Invoice by ID.
router.put("/void/:id", voidInvoice);

export default router;
