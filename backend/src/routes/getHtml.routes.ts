import express, { Router } from "express";
import { getHtml } from "../controllers/getHtml.controllers.js";

const router = express.Router();

// Description: Get Dummy HTML.
router.get("/", getHtml);

export default router;
