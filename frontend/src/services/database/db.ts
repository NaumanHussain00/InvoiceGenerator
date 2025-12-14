import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = () => {
  if (!db) {
    console.log('[Database] Initializing database, Platform:', Platform.OS);
    
    // Check if we're on web and SharedArrayBuffer is not available
    if (Platform.OS === 'web' && typeof SharedArrayBuffer === 'undefined') {
      const errorMsg = 'SQLite requires SharedArrayBuffer which is not available in this browser. Please use Android or iOS.';
      console.error('[Database]', errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      console.log('[Database] Opening database...');
      db = SQLite.openDatabaseSync('invoice_generator.db');
      console.log('[Database] Database opened successfully');
      
      console.log('[Database] Initializing schema...');
      initializeDatabase();
      console.log('[Database] Schema initialized successfully');
    } catch (error: any) {
      console.error('[Database] Error initializing database:', error);
      if (error.message?.includes('SharedArrayBuffer') || error.message?.includes('openDatabaseSync')) {
        throw new Error(
          'SQLite requires SharedArrayBuffer. For web, please use Android or iOS, ' +
          'or configure your server with Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers.'
        );
      }
      throw error;
    }
  }
  return db;
};

const initializeDatabase = () => {
  if (!db) return;

  // Enable foreign keys
  db.execSync([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }]);

  // Create Customer table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL UNIQUE,
        "firm" TEXT NOT NULL UNIQUE,
        "address" TEXT,
        "balance" REAL NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME
      );
    `,
    args: [],
  }]);

  // Create Product table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME
      );
    `,
    args: [],
  }]);

  // Create Invoice table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "Invoice" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "customerId" INTEGER NOT NULL,
        "totalAmount" REAL NOT NULL,
        "amountDiscount" REAL,
        "percentDiscount" REAL,
        "finalAmount" REAL NOT NULL,
        "custPrevBalance" REAL NOT NULL,
        "paidByCustomer" REAL NOT NULL,
        "remainingBalance" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      );
    `,
    args: [],
  }]);

  // Create Credit table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "Credit" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "customerId" INTEGER NOT NULL,
        "previousBalance" REAL NOT NULL,
        "amountPaidByCustomer" REAL NOT NULL,
        "finalBalance" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      );
    `,
    args: [],
  }]);

  // Create InvoiceLineItem table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "invoiceId" INTEGER NOT NULL,
        "productId" INTEGER NOT NULL,
        "productQuantity" INTEGER NOT NULL,
        "productAmountDiscount" REAL,
        "productPercentDiscount" REAL,
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id"),
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
      );
    `,
    args: [],
  }]);

  // Create TaxLineItem table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "TaxLineItem" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "invoiceId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "percent" REAL NOT NULL,
        "amount" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME,
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
      );
    `,
    args: [],
  }]);

  // Create PackagingLineItem table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "PackagingLineItem" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "invoiceId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME,
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
      );
    `,
    args: [],
  }]);

  // Create TransportationLineItem table
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "TransportationLineItem" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "invoiceId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME,
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
      );
    `,
    args: [],
  }]);

  // Create Sample table (if needed)
  db.execSync([{
    sql: `
      CREATE TABLE IF NOT EXISTS "Sample" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
    args: [],
  }]);

  // Create indexes
  db.execSync([
    { sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_customer" ON "Invoice"("customerId");', args: [] },
    { sql: 'CREATE INDEX IF NOT EXISTS "idx_credit_customer" ON "Credit"("customerId");', args: [] },
    { sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_line_item_invoice" ON "InvoiceLineItem"("invoiceId");', args: [] },
    { sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_line_item_product" ON "InvoiceLineItem"("productId");', args: [] },
  ]);
};

export default getDatabase;
