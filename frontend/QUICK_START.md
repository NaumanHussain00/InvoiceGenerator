# Quick Start Guide

## 🚀 Run the App in 3 Steps

### Step 1: Install Dependencies
```bash
cd InvoiceGenerator/frontend
npm install
```

### Step 2: Start Expo
```bash
npm start
```

### Step 3: Choose Your Platform
- **Press `a`** - Open in Android emulator
- **Press `i`** - Open in iOS simulator (macOS only)
- **Scan QR code** - Open in Expo Go app on your phone
- **Press `w`** - Open in web browser

## 📱 Using Expo Go (Recommended for Testing)

1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run `npm start` in the terminal

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## 💻 Using Emulator/Simulator

### Android
```bash
# Make sure Android Studio and emulator are running
npm run android
```

### iOS (macOS only)
```bash
# Make sure Xcode and simulator are running
npm run ios
```

## 🌐 Web Browser
```bash
npm run web
```

## ⚠️ Troubleshooting

**"expo: command not found"**
```bash
npm install -g expo-cli
# or use npx
npx expo start
```

**Clear cache if issues:**
```bash
npx expo start --clear
```

**Database not working?**
- Check console logs
- Database initializes automatically on first run
- All data is stored locally on device

## 📝 Notes

- ✅ App works **completely offline**
- ✅ No backend server needed
- ✅ All data stored in SQLite on device
- ✅ Use Expo Go for quick testing
- ✅ Use Development Build for production testing

