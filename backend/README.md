# Invoice Backend API

A RESTful API for managing customers and invoices built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - ORM for database management
- **PostgreSQL** - Database

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
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

   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/invoice?schema=public"
   PORT=3000
   ```

4. **Set up the database**

   ```bash
   # Run migrations
   npx prisma migrate dev

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
│   ├── schema.prisma             # Database schema (Customer, Product)
│   └── migrations/               # Database migrations
├── src/
│   ├── config/
│   │   └── db.ts                 # Prisma client configuration
│   ├── controllers/
│   │   ├── customer.controllers.ts
│   │   ├── product.controllers.ts
│   │   └── credit.controllers.ts
│   ├── routes/
│   │   ├── customer.routes.ts
│   │   ├── product.routes.ts
│   │   └── credit.routes.ts
│   ├── utils/
│   │   └── ResponseEntity.ts     # Response wrapper
│   └── index.ts                  # App entry, registers routes
├── .env                          # Environment variables
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

## 🧪 Testing with cURL

```bash
# Get all customers
curl http://localhost:3000/customers

# Create a customer
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"123-456-7890","firm":"Acme Corp"}'

# Get customer by ID
curl http://localhost:3000/customers/1

# Update customer
curl -X PUT http://localhost:3000/customers/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete customer
curl -X DELETE http://localhost:3000/customers/1

# Products
# Get all products
curl http://localhost:3000/products

# Create a product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Item A","subCategory":"Category X","price":99.99}'

# Get product by ID
curl http://localhost:3000/products/1

# Update product
curl -X PUT http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":120.5}'

# Delete product
curl -X DELETE http://localhost:3000/products/1

# Credits
# Create a credit (apply payment of 150 to customer 1)
curl -X POST http://localhost:3000/credits/customer/1 \
  -H "Content-Type: application/json" \
  -d '{"amountPaidByCustomer":150}'

# Get all credits
curl http://localhost:3000/credits

# Get credit by id
curl http://localhost:3000/credits/12

# Get all credits for a customer
curl http://localhost:3000/credits/customer/1

# Void a credit by id
curl -X PUT http://localhost:3000/credits/void/12
```

## 🗄️ Database Schema

```prisma
model Customer {
  id        Int       @id @default(autoincrement())
  name      String
  phone     String    @unique
  firm      String    @unique
  balance   Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
  Credit    Credit[]
}

model Product {
  id        Int       @id @default(autoincrement())
  name      String
  price     Float
  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

model Credit {
  id         Int      @id @default(autoincrement())
  customer   Customer @relation(fields: [customerId], references: [id])
  customerId Int

  previousBalance      Float // Balance before payment
  amountPaidByCustomer Float // Payment made by customer
  finalBalance         Float // New balance after payment

  status CreditStatus @default(ACTIVE)

  createdAt DateTime  @default(now())
  updatedAt DateTime? @updatedAt
}

enum CreditStatus {
  ACTIVE
  VOID
}
```

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Database
npx prisma migrate dev    # Create and apply migrations
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio (DB GUI)
npx prisma migrate reset  # Reset database

# Production
npm start            # Start production server
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

| Variable       | Description                  | Example                                         |
| -------------- | ---------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/invoice` |
| `PORT`         | Server port                  | `3000`                                          |

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

## 🐛 Known Issues

- None currently

### Credit route matching edge case

- In Express, generic routes like `GET /credits/:id` can shadow more specific routes like `GET /credits/customer/:customerId` if declared first.
- Ensure the more specific path is registered before the generic `/:id` path (or use a distinct path like `/credits/by-customer/:customerId`).

Example preferred order:

```ts
// More specific first
router.get("/customer/:customerId", getCreditsByCustomerId);
// Then generic by id
router.get("/:id", getCreditById);
```

## 📮 Contact

For issues and questions, please open a GitHub issue.
