# Invoice Backend API

A RESTful API for managing customers, products, invoices, credits, and customer ledger built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - ORM for database management
- **PostgreSQL** - Database
- **SQLite** - Database (local development)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   cd d:\Programming\invoice\backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

Create a `.env` file in the root directory (this project uses SQLite for local development):

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

4. **Set up the database**

For a local SQLite development database you can push the Prisma schema directly (no SQL migrations needed):

```bash
# Push schema to SQLite (creates dev.db)
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

5. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── customer.controllers.ts
│   │   ├── product.controllers.ts
│   │   ├── credit.controllers.ts
│   │   └── invoice.controllers.ts   # + Added
│   ├── routes/
│   │   ├── customer.routes.ts
│   │   ├── product.routes.ts
│   │   ├── credit.routes.ts
│   │   └── invoice.routes.ts        # + Added
│   ├── utils/
│   │   └── ResponseEntity.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

Note: Project runs in ESM mode (NodeNext). Import .ts files using .js extension at runtime (e.g., import x from "./file.js").

## 🔌 API Endpoints

### Base URL

```
http://localhost:3000
```

### Customer Endpoints

#### Customer Ledger & History

##### Get Customer Ledger (All Customers with Balances)

```http
GET /customers/ledger
```

Returns all customers with their current balances, total amount owed across all customers, and customer count.

**Response (200)**

```json
{
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "John Doe",
        "phone": "9876543210",
        "firm": "Acme Corp",
        "balance": 1500.5
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "phone": "9876543211",
        "firm": "Smith Enterprises",
        "balance": 2300.0
      }
    ],
    "totalOwed": 3800.5,
    "customerCount": 2
  },
  "message": "Ledger data fetched successfully",
  "statusCode": 200
}
```

**Use Case**: Display customer ledger overview with total outstanding balances.

##### Get Customer Transaction History

```http
GET /customers/history/:customerId
```

Returns complete transaction history for a specific customer, including all invoices and credits with balance tracking.

**Response (200)**

```json
{
  "data": {
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "9876543210",
      "firm": "Acme Corp",
      "balance": 1500.5
    },
    "transactions": [
      {
        "type": "invoice",
        "id": 5,
        "date": "2025-11-20T10:30:00.000Z",
        "amount": 2000.0,
        "paid": 500.0,
        "previousBalance": 0.0,
        "newBalance": 1500.0,
        "status": "ACTIVE"
      },
      {
        "type": "credit",
        "id": 3,
        "date": "2025-11-25T14:20:00.000Z",
        "amount": 0,
        "paid": 500.0,
        "previousBalance": 2000.0,
        "newBalance": 1500.0,
        "status": "ACTIVE"
      }
    ],
    "totalInvoices": 1,
    "totalCredits": 1
  },
  "message": "Customer history fetched successfully",
  "statusCode": 200
}
```

**Transaction Fields**:

- `type`: "invoice" or "credit"
- `id`: Transaction ID (invoiceId or creditId)
- `date`: Transaction creation date
- `amount`: Invoice amount (0 for credits)
- `paid`: Amount paid by customer
- `previousBalance`: Balance before transaction
- `newBalance`: Balance after transaction
- `status`: "ACTIVE" or "VOID"

**Use Case**: Display complete transaction history in customer ledger. Click any transaction to view full invoice/credit document.

**Error Response (400)**

```json
{
  "data": null,
  "message": "Invalid customer ID",
  "statusCode": 400
}
```

**Error Response (404)**

```json
{
  "data": null,
  "message": "Customer not found",
  "statusCode": 404
}
```

#### Basic Customer Operations

#### 1. Get All Customers

```http
GET /customers
```

**Response (200)**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "123-456-7890",
      "firm": "Acme Corp",
      "address": "1234 Main Street, City, State 12345",
      "balance": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Customers retrieved successfully",
  "statusCode": 200
}
```

#### 2. Create Customer

```http
POST /customers
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "John Doe",
  "phone": "123-456-7890",
  "firm": "Acme Corp",
  "address": "1234 Main Street, City, State 12345",
  "balance": 0
}
```

**Response (201)**

```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "phone": "123-456-7890",
    "firm": "Acme Corp",
    "address": "1234 Main Street, City, State 12345",
    "balance": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Customer Created Successfully",
  "statusCode": 201
}
```

**Error Response (409) - Duplicate Phone**

```json
{
  "data": null,
  "message": "Customer with phone 123-456-7890 already exists: John Doe",
  "statusCode": 409
}
```

#### 3. Get Customer by ID

```http
GET /customers/:id
```

**Response (200)**

```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "123-456-7890",
  "firm": "Acme Corp",
  "address": "1234 Main Street, City, State 12345",
  "balance": 0,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404)**

```json
{
  "error": "Customer not found"
}
```

#### 4. Update Customer

```http
PUT /customers/:id
Content-Type: application/json
```

**Request Body** (all fields optional)

```json
{
  "name": "Jane Doe",
  "phone": "098-765-4321",
  "firm": "New Corp",
  "address": "5678 New Avenue, Another City, State 67890",
  "balance": 100
}
```

**Response (200)**

```json
{
  "id": 1,
  "name": "Jane Doe",
  "phone": "098-765-4321",
  "firm": "New Corp",
  "address": "5678 New Avenue, Another City, State 67890",
  "balance": 100,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:25:00.000Z"
}
```

#### 5. Delete Customer

```http
DELETE /customers/:id
```

**Response (204)**

```
No Content
```

### Product Endpoints

#### 1. Get All Products

```http
GET /products
```

**Response (200)**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Item A",
      "price": 99.99,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Products retrieved successfully",
  "statusCode": 200
}
```

#### 2. Create Product

```http
POST /products
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "Item A",
  "price": 99.99
}
```

**Response (201)**

```json
{
  "data": {
    "id": 1,
    "name": "Item A",
    "price": 99.99,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Product Created Successfully",
  "statusCode": 201
}
```

#### 3. Get Product by ID

```http
GET /products/:id
```

**Response (200)**

```json
{
  "data": {
    "id": 1,
    "name": "Item A",
    "price": 99.99,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Product Retrieved Successfully",
  "statusCode": 200
}
```

#### 4. Update Product

```http
PUT /products/:id
Content-Type: application/json
```

**Request Body** (all fields optional)

```json
{
  "name": "Item A+",
  "price": 120.5
}
```

**Response (200)**

```json
{
  "data": {
    "id": 1,
    "name": "Item A+",
    "price": 120.5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:25:00.000Z"
  },
  "message": "Product Updated Successfully",
  "statusCode": 200
}
```

#### 5. Delete Product

```http
DELETE /products/:id
```

**Response (204)**

```
No Content
```

### Credit Endpoints

Credits represent customer payments applied against their outstanding balance. Creating a credit lowers the customer's balance. Voiding a credit reverts the balance back to the previous value.

Base path: `/credits`

#### 1. Create Credit (apply a payment)

```http
POST /credits/customer/:customerId
Content-Type: application/json
```

Request Body

```json
{
  "amountPaidByCustomer": 150.0
}
```

Behavior

- Looks up the customer's current `balance`.
- Computes `finalBalance = previousBalance - amountPaidByCustomer`.
- Updates the customer's `balance` atomically within a transaction.
- Creates a `Credit` record with `previousBalance`, `amountPaidByCustomer`, and `finalBalance`.
- Returns the created credit including `customer` details.

Response (201)

```json
{
  "data": {
    "id": 12,
    "customerId": 1,
    "previousBalance": 500.0,
    "amountPaidByCustomer": 150.0,
    "finalBalance": 350.0,
    "status": "ACTIVE",
    "createdAt": "2025-10-16T19:59:00.000Z",
    "updatedAt": null,
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "123-456-7890",
      "firm": "Acme Corp",
      "balance": 350.0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2025-10-16T19:59:00.000Z"
    }
  },
  "message": "Credit created successfully",
  "statusCode": 201
}
```

Error Responses

- 404 if the customer doesn't exist.
- 500 on unexpected errors.

#### 2. Get All Credits

```http
GET /credits
```

Response (200)

```json
{
  "data": [
    {
      "id": 12,
      "customerId": 1,
      "previousBalance": 500.0,
      "amountPaidByCustomer": 150.0,
      "finalBalance": 350.0,
      "status": "ACTIVE",
      "createdAt": "2025-10-16T19:59:00.000Z",
      "updatedAt": null,
      "customer": {
        "id": 1,
        "name": "John Doe",
        "phone": "123-456-7890",
        "firm": "Acme Corp",
        "balance": 350.0
      }
    }
  ],
  "message": "Credits retrieved successfully",
  "statusCode": 200
}
```

#### 3. Get Credit by ID

```http
GET /credits/:id
```

Returns the credit with its `customer`.

#### 4. Get Credits by Customer ID

```http
GET /credits/customer/:customerId
```

Returns all credits for a specific customer, including `customer` info.

#### 5. Void Credit (revert a payment)

```http
PUT /credits/void/:id
```

Behavior

- Fetches the credit by `id`. If it's already `VOID`, returns a 400 with message "Credit Already Voided".
- In a transaction: sets the customer's `balance` back to the credit's `previousBalance`, and updates the credit `status` to `VOID`.
- Returns the original credit data with a success message.

Responses

- 200 "Credit Voided Successfully" when the credit is voided.
- 404 if the credit doesn't exist.
- 400 if the credit is already void.

#### 6. Generate Credit Note HTML (A4 Size)

```http
GET /credits/credit/generate/:creditId
```

**Behavior**:

- Fetches the credit record with customer information
- Generates a professional A4-sized HTML credit note document
- Displays previous balance, amount paid, and new balance
- Returns HTML directly (Content-Type: text/html)

**Response (200)**

Returns A4-sized HTML document with:

- Credit note header with credit ID and date issued
- Company details (company name, address, contact)
- Customer information (name, firm, address)
- Credit status badge (ACTIVE/VOID)
- Transaction details table:
  - Previous balance
  - Amount paid by customer
  - New balance (highlighted)
- Professional credit note layout matching invoice design

The HTML uses:

- A4 dimensions (210mm × 297mm)
- Print-ready styling with @page rules
- Rupee (₹) currency formatting
- Purple accent color (#4B00FF) for branding consistency
- Responsive table layout

**Use Case**:

- Display credit notes in mobile app via WebView
- Click credit transactions in ledger to view full credit note
- Generate printable/downloadable credit notes
- Payment receipt for customers

**Errors**:

- 400 Invalid Credit ID
- 404 Credit Not Found
- 500 Failed to Generate Credit Note HTML

**Example**

```bash
# Generate credit note HTML
curl http://localhost:3000/credits/credit/generate/5

# Save to file
curl http://localhost:3000/credits/credit/generate/5 > credit_note.html

# Convert to PDF using wkhtmltopdf
wkhtmltopdf http://localhost:3000/credits/credit/generate/5 credit_note.pdf

# Or open in browser
open http://localhost:3000/credits/credit/generate/5
```

## Invoice Endpoints

Invoices represent sales to customers and adjust the customer's balance.

Base path: /invoices

Computation rules:

- custPrevBalance is read from the customer's current balance at creation time.
- remainingBalance = custPrevBalance + finalAmount - paidByCustomer
- On void: status becomes VOID and the customer's balance is reset to the invoice's custPrevBalance.
- Server trusts frontend monetary fields; minimal validation is performed. Ensure finalAmount is accurate.
- Taxes, packaging, and transportation are stored as separate line items on the invoice.

Fields:

- Invoice: customerId, totalAmount, amountDiscount?, percentDiscount?, finalAmount, paidByCustomer
- Product line item: productId, productQuantity, productAmountDiscount?, productPercentDiscount?
- Tax line item: name, percent, amount
- Packaging line item: name, amount
- Transportation line item: name, amount
- Note: Product price snapshot is not stored on line items.

1. Create Invoice

- POST /invoices
- Content-Type: application/json

Request body

```json
{
  "customerId": 3,
  "totalAmount": 1000,
  "amountDiscount": 50,
  "percentDiscount": 5,
  "finalAmount": 1035,
  "paidByCustomer": 500,
  "invoiceLineItems": [
    {
      "productId": 1,
      "productQuantity": 3,
      "productAmountDiscount": 10,
      "productPercentDiscount": 2
    }
  ],
  "taxLineItems": [{ "name": "GST", "percent": 3, "amount": 30 }],
  "packagingLineItems": [{ "name": "Box", "amount": 20 }],
  "transportationLineItems": [{ "name": "Delivery", "amount": 40 }]
}
```

Behavior

- Reads custPrevBalance from the customer.
- Creates the invoice and all line item groups in a single transaction.
- Updates customer.balance to remainingBalance.

Response (201)

```json
{
  "data": {
    "id": 12,
    "customerId": 3,
    "totalAmount": 1000,
    "amountDiscount": 50,
    "percentDiscount": 5,
    "finalAmount": 1035,
    "custPrevBalance": 200,
    "paidByCustomer": 500,
    "remainingBalance": 735,
    "status": "ACTIVE",
    "createdAt": "2025-10-16T19:59:00.000Z",
    "updatedAt": null,
    "customer": { "...": "..." },
    "invoiceLineItems": [
      {
        "id": 34,
        "invoiceId": 12,
        "productId": 1,
        "productQuantity": 3,
        "productAmountDiscount": 10,
        "productPercentDiscount": 2,
        "product": { "...": "..." }
      }
    ],
    "taxLineItems": [
      {
        "id": 1,
        "invoiceId": 12,
        "name": "GST",
        "percent": 3,
        "amount": 30,
        "createdAt": "...",
        "updatedAt": null
      }
    ],
    "packagingLineItems": [
      {
        "id": 1,
        "invoiceId": 12,
        "name": "Box",
        "amount": 20,
        "createdAt": "...",
        "updatedAt": null
      }
    ],
    "transportationLineItems": [
      {
        "id": 1,
        "invoiceId": 12,
        "name": "Delivery",
        "amount": 40,
        "createdAt": "...",
        "updatedAt": null
      }
    ]
  },
  "message": "Invoice Created Successfully",
  "statusCode": 201
}
```

Errors

- 404 Customer Not Found
- 400 Invalid Customer ID (if invalid type)
- 500 Failed to Create Invoice

2. Get All Invoices

- GET /invoices

Response (200)

```json
{
  "data": [
    {
      "...": "...",
      "customer": { "...": "..." },
      "invoiceLineItems": [{ "...": "...", "product": { "...": "..." } }],
      "taxLineItems": [{ "...": "..." }],
      "packagingLineItems": [{ "...": "..." }],
      "transportationLineItems": [{ "...": "..." }]
    }
  ],
  "message": "Invoices Fetched Successfully",
  "statusCode": 200
}
```

3. Get Invoices by Customer

- GET /invoices/customer/:customerId

Response (200)

```json
{
  "data": [
    /* invoices with all line item groups */
  ],
  "message": "Customer Invoices Fetched Successfully",
  "statusCode": 200
}
```

4. Get Invoice by ID

- GET /invoices/:id

Response (200)

```json
{
  "data": {
    /* invoice with customer, invoiceLineItems.product, tax/packaging/transportation line items */
  },
  "message": "Invoice Fetched Successfully",
  "statusCode": 200
}
```

Errors

- 400 Invalid Invoice ID
- 404 Invoice Not Found

5. Void Invoice

- PUT /invoices/void/:id

Behavior

- Fails if already VOID.
- Sets status to VOID and resets customer.balance to custPrevBalance atomically.

Response (200)

```json
{
  "data": {
    /* voided invoice with relations */
  },
  "message": "Invoice Voided Successfully",
  "statusCode": 200
}
```

#### 6. Search Invoices

```http
GET /invoices/search?invoiceId=&phone=&customerName=&dateFrom=&dateTo=
```

**Query Parameters** (at least one required):

- `invoiceId`: Search by invoice ID (exact match)
- `phone`: Search by customer phone (partial match)
- `customerName`: Search by customer name (partial match)
- `dateFrom`: Start date (YYYY-MM-DD format)
- `dateTo`: End date (YYYY-MM-DD format)

**Response (200)**

```json
{
  "data": [
    {
      "id": 5,
      "customerId": 1,
      "totalAmount": 2000.0,
      "finalAmount": 2050.0,
      "paidByCustomer": 500.0,
      "remainingBalance": 1550.0,
      "status": "ACTIVE",
      "createdAt": "2025-11-20T10:30:00.000Z",
      "customer": {
        "id": 1,
        "name": "John Doe",
        "phone": "9876543210",
        "firm": "Acme Corp"
      }
    }
  ],
  "message": "Invoices Search Results",
  "statusCode": 200
}
```

**Use Case**: Search invoices by various criteria in the Edit Invoice page.

**Error Response (400)**

```json
{
  "data": null,
  "message": "Invalid dateFrom format. Use YYYY-MM-DD",
  "statusCode": 400
}
```

#### 7. Update Invoice

```http
PUT /invoices/:id
Content-Type: application/json
```

**Request Body** (all fields optional)

```json
{
  "totalAmount": 1200,
  "amountDiscount": 60,
  "percentDiscount": 0,
  "finalAmount": 1240,
  "paidByCustomer": 600,
  "invoiceLineItems": [
    {
      "productId": 1,
      "productQuantity": 4,
      "productAmountDiscount": 15,
      "productPercentDiscount": 0
    }
  ],
  "taxLineItems": [
    {
      "name": "GST",
      "percent": 5,
      "amount": 60
    }
  ],
  "packagingLineItems": [
    {
      "name": "Premium Box",
      "amount": 25
    }
  ],
  "transportationLineItems": [
    {
      "name": "Express Delivery",
      "amount": 50
    }
  ]
}
```

**Behavior**:

- Cannot update VOID invoices
- Recalculates customer balance based on new amounts
- Replaces line items completely if provided
- Updates invoice and customer balance atomically

**Response (200)**

```json
{
  "data": {
    /* updated invoice with all relations */
  },
  "message": "Invoice Updated Successfully",
  "statusCode": 200
}
```

**Errors**:

- 400 Invalid Invoice ID
- 400 Cannot Update Voided Invoice
- 404 Invoice Not Found
- 500 Failed to Update Invoice

#### 8. Generate Invoice HTML (A4 Size)

```http
GET /invoices/invoice/generate/:id
```

**Behavior**:

- Fetches the invoice with all related data (customer, line items, taxes, packaging, transportation)
- Generates a professional A4-sized HTML invoice document
- Calculates and displays all amounts, taxes, and discounts
- Returns HTML directly (Content-Type: text/html)

**Response (200)**

Returns A4-sized HTML document with:

- Company details and invoice header
- Invoice number and date
- Customer billing information (name, firm, address)
- Product line items table with rates, quantities, and discounts
- Tax calculations (displays both percentage and amount)
- Packaging and transportation charges
- Subtotal, total discount, taxes, final amount
- Amount paid and remaining balance

The HTML uses:

- A4 dimensions (210mm × 297mm)
- Print-ready styling with @page rules
- Rupee (₹) currency formatting
- Professional invoice layout
- Purple accent color (#4B00FF)

**Use Case**:

- Display invoices in mobile app via WebView
- Click invoice transactions in ledger to view full invoice
- Generate printable/downloadable invoices

**Errors**:

- 400 Invalid Invoice ID
- 404 Invoice Not Found
- 500 Failed to Generate Invoice

**Example**

```bash
# Generate invoice HTML
curl http://localhost:3000/invoices/invoice/generate/12

# Save to file
curl http://localhost:3000/invoices/invoice/generate/12 > invoice.html

# Convert to PDF using wkhtmltopdf
wkhtmltopdf http://localhost:3000/invoices/invoice/generate/12 invoice.pdf

# Or open in browser
open http://localhost:3000/invoices/invoice/generate/12
```

## 🗄️ Database Schema

```prisma
// Enums
enum InvoiceStatus {
  ACTIVE
  VOID
}

enum CreditStatus {
  ACTIVE
  VOID
}

// Models
model Customer {
  id        Int       @id @default(autoincrement())
  name      String
  phone     String    @unique
  firm      String    @unique
  address   String?
  balance   Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt

  credits  Credit[]
  invoices Invoice[]
}

model Product {
  id        Int       @id @default(autoincrement())
  name      String
  price     Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt

  invoiceLineItems InvoiceLineItem[]
}

model Credit {
  id         Int      @id @default(autoincrement())
  customer   Customer @relation(fields: [customerId], references: [id])
  customerId Int

  previousBalance      Float
  amountPaidByCustomer Float
  finalBalance         Float

  status CreditStatus @default(ACTIVE)

  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

model Invoice {
  id         Int      @id @default(autoincrement())
  customer   Customer @relation(fields: [customerId], references: [id])
  customerId Int

  totalAmount     Float
  amountDiscount  Float?
  percentDiscount Float?
  finalAmount     Float

  custPrevBalance  Float
  paidByCustomer   Float
  remainingBalance Float

  status InvoiceStatus @default(ACTIVE)

  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt

  invoiceLineItems        InvoiceLineItem[]
  taxLineItems            TaxLineItem[]
  packagingLineItems      PackagingLineItem[]
  transportationLineItems TransportationLineItem[]
}

model InvoiceLineItem {
  id Int @id @default(autoincrement())

  invoice   Invoice @relation(fields: [invoiceId], references: [id])
  invoiceId Int

  product   Product @relation(fields: [productId], references: [id])
  productId Int

  productQuantity        Int
  productAmountDiscount  Float?
  productPercentDiscount Float?
}

model TaxLineItem {
  id        Int     @id @default(autoincrement())
  invoice   Invoice @relation(fields: [invoiceId], references: [id])
  invoiceId Int

  name      String
  percent   Float
  amount    Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

model PackagingLineItem {
  id        Int     @id @default(autoincrement())
  invoice   Invoice @relation(fields: [invoiceId], references: [id])
  invoiceId Int

  name      String
  amount    Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

model TransportationLineItem {
  id        Int     @id @default(autoincrement())
  invoice   Invoice @relation(fields: [invoiceId], references: [id])
  invoiceId Int

  name      String
  amount    Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}
```

Notes

- Submit either percent- or amount-based taxes per line; both are stored as provided in TaxLineItem.
- Line items store quantity and discounts; product price snapshot is not stored.
- Credits are independent of invoice creation.

## 🔄 Complete Workflow Example

### Typical Invoice & Payment Flow

1. **Create Customer**

   ```bash
   POST /customers
   # Creates customer with initial balance 0
   ```

2. **Create Products**

   ```bash
   POST /products
   # Add products to catalog
   ```

3. **Create Invoice**

   ```bash
   POST /invoices
   # Customer balance increases by (finalAmount - paidByCustomer)
   ```

4. **View Customer Ledger**

   ```bash
   GET /customers/ledger
   # See all customers with outstanding balances
   ```

5. **View Transaction History**

   ```bash
   GET /customers/history/:customerId
   # See all invoices and credits for customer
   ```

6. **View Invoice Document**

   ```bash
   GET /invoices/invoice/generate/:id
   # Returns HTML invoice (clickable from ledger)
   ```

7. **Record Payment**

   ```bash
   POST /credits/customer/:customerId
   # Customer balance decreases by payment amount
   ```

8. **View Credit Note Document**

   ```bash
   GET /credits/credit/generate/:creditId
   # Returns HTML credit note (clickable from ledger)
   ```

9. **Void Transaction** (if needed)
   ```bash
   PUT /invoices/void/:id
   # OR
   PUT /credits/void/:id
   # Reverts balance to previous state
   ```

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload (nodemon)

# Database
npx prisma db push        # Push schema to SQLite (for development)
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio (DB GUI)
npx prisma migrate dev    # Create and apply migrations (for production DB)
npx prisma migrate reset  # Reset database

# Production
npm start            # Start production server
npm run build        # Build TypeScript (if needed)
```

## ⚠️ Error Codes

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Success                        |
| 201         | Created                        |
| 204         | No Content (Delete)            |
| 400         | Bad Request (Validation Error) |
| 404         | Not Found                      |
| 409         | Conflict (Duplicate)           |
| 500         | Internal Server Error          |

## 🔐 Environment Variables

| Variable       | Description                | Example         |
| -------------- | -------------------------- | --------------- |
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `PORT`         | Server port                | `3000`          |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 👤 Author

Nauman Hussain

## 🎯 Key Features

### Customer Ledger System

- **Real-time Balance Tracking**: Every invoice and credit automatically updates customer balance
- **Transaction History**: Complete chronological history of all transactions per customer
- **Clickable Documents**: Frontend can display full invoice/credit HTML by calling generate endpoints
- **Balance Calculation**:
  - Invoice: `newBalance = previousBalance + finalAmount - paidByCustomer`
  - Credit: `newBalance = previousBalance - amountPaidByCustomer`
- **Void Protection**: Voiding reverses balance changes atomically

### Document Generation

- **A4-Sized PDFs**: Professional print-ready documents
- **Consistent Branding**: Purple accent color (#4B00FF) across all documents
- **Detailed Invoices**: Line items, taxes, packaging, transportation
- **Clean Credit Notes**: Payment receipts with balance tracking
- **WebView Compatible**: HTML output works in React Native WebView

### Data Integrity

- **Atomic Transactions**: All balance updates use Prisma transactions
- **Cascade Relationships**: Deleting invoice/credit properly handles line items
- **Status Tracking**: ACTIVE/VOID status prevents accidental modifications
- **Validation**: Input validation on all endpoints

## 🐛 Known Issues & Best Practices

### Route Ordering

In Express, generic routes like `GET /credits/:id` can shadow more specific routes like `GET /credits/customer/:customerId` if declared first.

**Solution**: Register more specific paths before generic ones

```ts
// ✅ Correct order
router.get("/customer/:customerId", getCreditsByCustomerId);
router.get("/credit/generate/:creditId", generateCredit);
router.get("/:id", getCreditById);

// ❌ Wrong order - /:id would catch everything
router.get("/:id", getCreditById);
router.get("/customer/:customerId", getCreditsByCustomerId);
```

### Balance Consistency

- Always use the `/customers/ledger` and `/customers/history/:id` endpoints to display balances
- Don't cache balance values in the frontend
- Refresh ledger after creating invoices/credits

### Database Migrations

- Use `npx prisma db push` for quick SQLite development
- Use `npx prisma migrate dev` for production-grade migrations
- Always backup database before schema changes

### Error Handling

All endpoints return consistent error format:

```json
{
  "data": null,
  "message": "Error description",
  "statusCode": 400 // or 404, 409, 500
}
```

## 🔐 Security Considerations

### Current Implementation

- No authentication/authorization (suitable for local/internal use)
- SQLite database (not recommended for production with multiple users)
- CORS enabled for all origins

### For Production Deployment

Consider adding:

- JWT authentication
- API rate limiting
- Input sanitization
- PostgreSQL or MySQL database
- Environment-based CORS configuration
- HTTPS/TLS encryption
- Database connection pooling
- Backup strategy

## 📈 Performance Tips

- Use Prisma's `include` selectively to avoid over-fetching
- Index frequently queried fields (phone, firm in Customer)
- Consider pagination for large result sets
- Use database transactions for balance updates
- Cache product catalog if it rarely changes

## 🧪 Testing

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest supertest @types/supertest

# Run tests
npm test

# Test specific endpoint
curl -X GET http://localhost:3000/customers/ledger
curl -X GET http://localhost:3000/customers/history/1
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 📮 Contact

**Nauman Hussain**

- GitHub: [@NaumanHussain00](https://github.com/NaumanHussain00)
- Repository: [InvoiceGenerator](https://github.com/NaumanHussain00/InvoiceGenerator)

For issues and questions, please open a GitHub issue.
