# Invoice Generator

A full-stack invoice management application with React Native mobile frontend and Node.js backend API.

## 🚀 Features

### Customer Management

- Add, edit, and view customers
- Track customer balances
- View customer transaction history in ledger

### Product Management

- Add and manage products
- Set product prices
- **Interactive Product Entry**: Single input form with an interactive table for adding and editing products in invoices
- Automatic product selection with search and dropdown
- **Edit Product**: Search, edit, and delete existing products

### Invoice Generation

- Create invoices with multiple products
- **Streamlined Product Entry**: Easily add, edit, and remove products using a unified input form and summary table
- Apply discounts (percentage or amount-based)
- Add taxes, packaging, and transportation charges
- Generate professional A4-sized invoice PDFs
- View invoice history
- **Edit Invoice**: Search and view invoice details
- **Click on invoice transactions in ledger to view full invoice**

### Credit Notes

- Record customer payments
- Generate professional credit notes
- Update customer balances automatically
- **Click on credit transactions in ledger to view full credit note**

### Customer Ledger

- Password-protected ledger access (default: 5678)
- View complete transaction history per customer
- See all invoices and credits in chronological order
- Click any transaction to view the full document (invoice or credit note)
- Track customer balances over time

### Mobile App Features

- React Native mobile application
- Works on Android and iOS
- Offline-ready architecture
- Professional UI/UX

### App Security

- **App Lock**: Password protection on application launch (Default: 1234)
- **Ledger Lock**: Separate password for sensitive ledger data (Default: 5678)

## 📁 Project Structure

```
invoice/
├── backend/           # Node.js + Express + Prisma API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── config/
│   │   └── utils/
│   └── prisma/
├── frontend/          # React Native mobile app
│   ├── src/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── config/
│   │   └── theme/
│   ├── android/
│   └── ios/
└── README.md
```

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - ORM for database management
- **SQLite** - Database (local development)

### Frontend

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **Axios** - HTTP client
- **React Native WebView** - For displaying invoices and credit notes

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Java Development Kit (JDK 17)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NaumanHussain00/InvoiceGenerator.git
cd invoice
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with:
# DATABASE_URL="file:./dev.db"
# PORT=3000

# Set up the database
npx prisma db push
npx prisma generate

# Start the backend server
npm run dev
```

The backend will be running on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# For iOS only (macOS required)
cd ios
bundle install
bundle exec pod install
cd ..

# Start Metro bundler
npm start

# In another terminal, run the app
# For Android
npm run android

# For iOS
npm run ios
```

## 📱 Using the Application

### First Time Setup

1. **Start the Backend**: Make sure the backend server is running on port 3000
2. **Launch the App**: Start the React Native app on your emulator/device
3. **Add Customers**: Navigate to "Add Customer" and create customer profiles
4. **Add Products**: Navigate to "Add Product" and create your product catalog

### Creating an Invoice

1. Go to "Generate Invoice"
2. Select a customer from the dropdown
3. Add products (quantities, discounts)
4. Add taxes, packaging, or transportation charges (optional)
5. Enter amount paid by customer
6. Save the invoice
7. View/download the generated invoice

### Recording Payments (Credits)

1. Go to "Generate Credit"
2. Select a customer
3. Enter the amount paid by customer
4. Save the credit note
5. View/download the generated credit note

### Viewing Customer Ledger

1. Go to "Ledger"
2. Enter the ledger password (default: 5678)
3. View all customers with outstanding balances
4. **Tap on any customer** to see their transaction history
5. **Tap on any transaction** to view the full invoice or credit note document
6. Transactions show:
   - Previous balance
   - Transaction amount
   - New balance
   - Transaction status (ACTIVE/VOID)

### Changing Ledger Password

1. Open the Ledger
2. Tap "Change Password" in the header
3. Enter new password (minimum 4 characters)
4. Confirm the password

## 🔌 API Endpoints

See [backend/README.md](backend/README.md) for complete API documentation.

### Key Endpoints

```
# Customers
GET    /customers
POST   /customers
GET    /customers/:id
PUT    /customers/:id
DELETE /customers/:id
GET    /customers/ledger
GET    /customers/history/:id

# Products
GET    /products
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id

# Invoices
GET    /invoices
POST   /invoices
GET    /invoices/:id
GET    /invoices/customer/:customerId
PUT    /invoices/void/:id
GET    /invoices/invoice/generate/:id

# Credits
GET    /credits
POST   /credits/customer/:customerId
GET    /credits/:id
GET    /credits/customer/:customerId
PUT    /credits/void/:id
GET    /credits/credit/generate/:creditId
```

## 🗄️ Database Schema

The application uses the following main models:

- **Customer**: id, name, phone, firm, address, balance
- **Product**: id, name, price
- **Invoice**: id, customerId, amounts, discounts, status
- **Credit**: id, customerId, previousBalance, amountPaid, finalBalance, status
- **InvoiceLineItem**: Product line items with quantities and discounts
- **TaxLineItem**: Tax entries for invoices
- **PackagingLineItem**: Packaging charges
- **TransportationLineItem**: Transportation charges

See [backend/README.md](backend/README.md) for the complete schema.

## 🎨 Features in Detail

### Invoice Generation

- Multi-product invoices
- Percentage or amount-based discounts
- Tax calculations (GST, etc.)
- Packaging and transportation charges
- Professional A4-sized PDF generation
- Balance tracking

### Credit Note Generation

- Payment recording
- Balance adjustment
- Professional credit note PDFs
- Transaction history

### Customer Ledger

- **Password Protection**: Secure access to financial data
- **Transaction History**: Complete chronological view of all customer transactions
- **Interactive Transactions**: Click any invoice or credit transaction to view the full document
- **Real-time Balance**: See current outstanding balance for each customer
- **Transaction Summary**: View total invoices, credits, and transactions per customer
- **Status Indicators**: Visual indicators for ACTIVE/VOID transactions

### Mobile Experience

- Responsive design
- Touch-optimized interface
- Professional UI/UX
- Smooth navigation
- Error handling with fallback URLs

## 🔧 Configuration

### API Configuration (Frontend)

The app supports multiple backend URLs with automatic fallback:

```typescript
// frontend/src/config/api.ts
export const API_BASE_URL = "http://10.0.2.2:3000"; // Android emulator
export const API_FALLBACK_URLS = [
  "http://localhost:3000",
  "http://192.168.1.100:3000", // Your local IP
];
```

### Ledger Password

- Default password: `5678`
- Stored in device AsyncStorage
- Changeable from the app
- Minimum 4 characters required

## 📝 Development Scripts

### Backend

```bash
npm run dev      # Start dev server with hot reload
npm start        # Start production server
npx prisma studio  # Open database GUI
```

### Frontend

```bash
npm start        # Start Metro bundler
npm run android  # Run on Android
npm run ios      # Run on iOS
npm test         # Run tests
```

## 🐛 Troubleshooting

### Backend Connection Issues

1. Make sure backend is running on port 3000
2. For Android emulator, use `10.0.2.2:3000` instead of `localhost:3000`
3. For physical devices, use your computer's local IP address
4. Check firewall settings

### Database Issues

```bash
# Reset database
cd backend
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### React Native Issues

```bash
# Clear cache
npm start -- --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..

# Clean iOS build (macOS only)
cd ios && pod deintegrate && pod install && cd ..
```

### Ledger Not Opening Transactions

1. Ensure backend is running
2. Check that the transaction status is ACTIVE
3. Verify the invoice/credit ID exists
4. Check network connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 👤 Author

**Nauman Hussain**

- GitHub: [@NaumanHussain00](https://github.com/NaumanHussain00)

## 🙏 Acknowledgments

- React Native Community
- Prisma Team
- Express.js Team

## 📮 Support

For issues and questions:

- Open a GitHub issue
- Check existing documentation
- Review the backend and frontend README files

## 🔮 Future Enhancements

- [ ] Multi-currency support
- [ ] Email invoice delivery
- [ ] SMS notifications
- [ ] Analytics dashboard
- [ ] Backup/restore functionality
- [ ] Export to Excel
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Inventory management
- [ ] Recurring invoices

## 📊 Version History

- **v2.1.0** - Product Section Refactoring
  - Single input form for adding products
  - Interactive table for product management in invoices
  - Improved UI/UX for product entry
- **v2.0.0** - Security & Management Update
  - App entry password protection
  - Edit Invoice page with search filters
  - Edit Product page
  - Enhanced Customer Ledger
- **v1.0.0** - Initial release
  - Customer management
  - Product management
  - Invoice generation
  - Credit notes
  - Customer ledger with clickable transactions
  - Mobile app for Android and iOS
