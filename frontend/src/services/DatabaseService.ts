import { open } from 'react-native-quick-sqlite';

// Open the database
const db = open({ name: 'invoice_app.db' });

export const initDatabase = () => {
  console.log('[Database] Initializing tables...');

  // Customer Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      firm TEXT UNIQUE,
      address TEXT,
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT
    );
  `);

  // Product Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT
    );
  `);

  // Credit Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Credit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      previousBalance REAL NOT NULL,
      amountPaidByCustomer REAL NOT NULL,
      finalBalance REAL NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (customerId) REFERENCES Customer(id)
    );
  `);

  // Invoice Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      totalAmount REAL NOT NULL,
      amountDiscount REAL,
      percentDiscount REAL,
      finalAmount REAL NOT NULL,
      custPrevBalance REAL NOT NULL,
      paidByCustomer REAL NOT NULL,
      remainingBalance REAL NOT NULL,
      numberOfCartons INTEGER,
      customerName TEXT,
      customerPhone TEXT,
      customerFirm TEXT,
      customerAddress TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (customerId) REFERENCES Customer(id)
    );
  `);

  // InvoiceLineItem Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS InvoiceLineItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      productId INTEGER,
      productName TEXT,
      productPrice REAL,
      productQuantity INTEGER NOT NULL,
      productAmountDiscount REAL,
      productPercentDiscount REAL,
      FOREIGN KEY (invoiceId) REFERENCES Invoice(id),
      FOREIGN KEY (productId) REFERENCES Product(id)
    );
  `);

  // TaxLineItem Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS TaxLineItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      name TEXT NOT NULL,
      percent REAL NOT NULL,
      amount REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (invoiceId) REFERENCES Invoice(id)
    );
  `);

  // PackagingLineItem Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS PackagingLineItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (invoiceId) REFERENCES Invoice(id)
    );
  `);

  // TransportationLineItem Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS TransportationLineItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (invoiceId) REFERENCES Invoice(id)
    );
  `);

  console.log('[Database] Tables initialized successfully.');
};

export const getDb = () => db;

export default db;
