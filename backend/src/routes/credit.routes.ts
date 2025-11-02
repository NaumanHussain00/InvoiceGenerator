import express, { Router } from "express";

import {
  createCredit,
  getAllCredits,
  getCreditById,
  getCreditsByCustomerId,
  voidCreditById,
  generateCredit,
} from "../controllers/credit.controllers.js";

const router = express.Router();

// Description: Create a new credit entry.
router.post("/customer/:customerId", createCredit);

// Description: Return all credits.
router.get("/", getAllCredits);

// Description: Get a single credit by ID.
router.get("/:id", getCreditById);

// Description: Get all credits for a specific customer by Customer ID.
router.get("/customer/:customerId", getCreditsByCustomerId);

// Description: Void a credit entry by ID.
router.put("/void/:id", voidCreditById);

// GET /api/credit/generate/:creditId
router.get("/credit/generate/:creditId", generateCredit);

export default router;
