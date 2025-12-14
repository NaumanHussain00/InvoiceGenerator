# How to Run the Invoice Generator App with Expo

## Prerequisites

1. **Node.js** (v20 or higher) - Already installed ✓
2. **Expo CLI** - Install globally:
   ```bash
   npm install -g expo-cli
   ```
   Or use npx (no installation needed)

3. **Expo Go App** (for testing on physical devices):
   - iOS: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd InvoiceGenerator/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the App

### Option 1: Using Expo Go (Easiest - for testing)

1. **Start the Expo development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **Choose how to run:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your physical device
   - Press `w` to open in web browser

### Option 2: Development Build (Recommended for production)

If you need custom native modules or want a production-like build:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build for development:**
   ```bash
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

### Option 3: Local Development Build

1. **For Android:**
   ```bash
   npm run android
   ```
   (Requires Android Studio and emulator setup)

2. **For iOS:**
   ```bash
   npm run ios
   ```
   (Requires Xcode and iOS simulator - macOS only)

## Quick Start Commands

```bash
# Start Expo development server
npm start

# Start with Android
npm run android

# Start with iOS
npm run ios

# Start with Web
npm run web
```

## Troubleshooting

### If you get "Expo not found" error:
```bash
npm install -g expo-cli
```

### If database doesn't initialize:
- Make sure the app has proper permissions
- Check console logs for database errors
- The database is created automatically on first run

### If you see module resolution errors:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### For Android emulator:
- Make sure Android Studio is installed
- Start an Android emulator before running `npm run android`
- Or use Expo Go app on a physical device

### For iOS simulator (macOS only):
- Make sure Xcode is installed
- Run `xcode-select --install` if needed
- Start iOS simulator before running `npm run ios`

## Database

The app uses **expo-sqlite** for local database storage. The database file is automatically created when the app first runs. All data is stored locally on the device.

## Project Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── database/
│   │   │   └── db.ts          # Database initialization
│   │   ├── customer.service.ts
│   │   ├── product.service.ts
│   │   ├── credit.service.ts
│   │   └── invoice.service.ts
│   └── components/            # React components
├── app.json                   # Expo configuration
├── package.json
└── App.tsx                    # Main app entry
```

## Notes

- The app works **completely offline** - no backend server needed
- All data is stored in SQLite database on the device
- Use Expo Go for quick testing and development
- Use Development Build for testing with production-like environment

