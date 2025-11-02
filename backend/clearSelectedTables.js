
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function clearSelectedTables() {
  const tablesToClear = ["invoice", "invoiceLineItem", "taxLineItem", "packagingLineItem", "transportationLineItem"]; // ← yahan apne table names likho

  for (const table of tablesToClear) {
    try {
      await prisma[table].deleteMany({});
      console.log(`Cleared table: ${table}`);
    } catch (err) {
      console.error(`Failed to clear table ${table}: ${err.message}`);
    }
  }

  await prisma.$disconnect();
  console.log("Selected tables cleared");
}

clearSelectedTables();