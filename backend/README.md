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
│   │   └── product.controllers.ts
│   ├── routes/
│   │   ├── customer.routes.ts
│   │   └── product.routes.ts
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
      "amount": 0,
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
  "firm": "Acme Corp"
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
    "amount": 0,
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
  "amount": 0,
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
  "firm": "New Corp"
}
```

**Response (200)**

```json
{
  "id": 1,
  "name": "Jane Doe",
  "phone": "098-765-4321",
  "firm": "New Corp",
  "amount": 0,
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
      "subCategory": "Category X",
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
  "subCategory": "Category X",
  "price": 99.99
}
```

**Response (201)**

```json
{
  "data": {
    "id": 1,
    "name": "Item A",
    "subCategory": "Category X",
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
    "subCategory": "Category X",
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
  "subCategory": "Category Y",
  "price": 120.5
}
```

**Response (200)**

```json
{
  "data": {
    "id": 1,
    "name": "Item A+",
    "subCategory": "Category Y",
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
```

## 🗄️ Database Schema

```prisma
model Customer {
  id        Int      @id @default(autoincrement())
  name      String
  phone     String   @unique
  firm      String   @unique
  amount    Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String
  subCategory String?
  price       Float
  createdAt   DateTime  @default(now())
  updatedAt   DateTime? @updatedAt
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

Your Name

## 🐛 Known Issues

- None currently

## 📮 Contact

For issues and questions, please open a GitHub issue.
