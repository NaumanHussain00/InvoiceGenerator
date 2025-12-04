import prisma from "./config/db.js";
import express, { type Express } from "express";
import cors from "cors";

const app: Express = express();
app.use(express.json());

// ✅ Properly enable CORS middleware
app.use(cors());

// OR configure CORS explicitly if needed
// app.use(cors({
//   origin: "http://localhost:5173", // frontend URL
//   credentials: true,
// }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import creditRoutes from "./routes/credit.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import getHtmlRoutes from "./routes/getHtml.routes.js";

// ✅ Attach routers
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/credits", creditRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/html", getHtmlRoutes);

// Start server
const PORT = process.env.PORT ?? 3000;
const HOST = "0.0.0.0";

app
  .listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Also accessible on http://0.0.0.0:${PORT}`);
    console.log(`✅ Android emulator can access via http://10.0.2.2:${PORT}`);
  })
  .on("error", (err: Error) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

export default app;
