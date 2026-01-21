import { open } from 'react-native-quick-sqlite';

// Open the database
const db = open({ name: 'invoice_app.db' });

export const initDatabase = () => {
  console.log('[Database] Initializing tables...');

  // Migrations Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration 001: Remove Unique Constraint on Firm
  try {
    const migration001 = '001_remove_firm_unique_constraint';
    const mCheck = db.execute(`SELECT * FROM Migrations WHERE name = '${migration001}'`);
    if (!mCheck.rows || mCheck.rows.length === 0) {
        console.log('[Database] Checking migration: ' + migration001);
        const tableCheck = db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='Customer'`);
        if (tableCheck.rows && tableCheck.rows.length > 0) {
             // Existing Customer table, migrate it
             console.log('[Database] Applying migration 001...');
             try {
                 db.execute('BEGIN TRANSACTION');
                 db.execute('ALTER TABLE Customer RENAME TO Customer_old');
                 db.execute(`
                      CREATE TABLE Customer (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        phone TEXT UNIQUE NOT NULL,
                        firm TEXT,
                        address TEXT,
                        balance REAL NOT NULL DEFAULT 0,
                        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TEXT
                      );
                 `);
                 db.execute('INSERT INTO Customer SELECT * FROM Customer_old');
                 db.execute('DROP TABLE Customer_old');
                 db.execute('INSERT INTO Migrations (name) VALUES (?)', [migration001]);
                 db.execute('COMMIT');
                 console.log('[Database] Migration 001 applied successfully.');
             } catch (e: any) {
                 console.error('[Database] Migration 001 failed:', e);
                 try { db.execute('ROLLBACK'); } catch (r) {}
                 throw e; 
             }
        } else {
            // New install, just mark migration as done
             db.execute('INSERT INTO Migrations (name) VALUES (?)', [migration001]);
        }
    }
  } catch(e) {
      console.error('Migration Error:', e);
  }

  // Customer Table
  db.execute(`
    CREATE TABLE IF NOT EXISTS Customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      firm TEXT,
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
