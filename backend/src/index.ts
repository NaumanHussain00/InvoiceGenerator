import prisma from "./config/db.js";
import express, { type Express } from "express";

const app: Express = express();
app.use(express.json());

// Import the router using the .js extension so ts-node/esm can resolve it
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);

// Start the server
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
