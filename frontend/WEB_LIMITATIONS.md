# Web Platform Limitations

## ⚠️ SQLite on Web

The app uses `expo-sqlite` which requires **SharedArrayBuffer** support. This is not available in web browsers by default due to security restrictions.

## ✅ Recommended Platforms

**For best experience, use:**
- **Android** (Emulator or Physical Device via Expo Go) ✅
- **iOS** (Simulator or Physical Device via Expo Go) ✅

## 🌐 Web Support

Web support is **limited** because:
1. SharedArrayBuffer requires HTTPS and specific security headers
2. The Expo development server doesn't provide these headers by default
3. SQLite on web has performance limitations

## 🔧 If You Need Web Support

To enable SQLite on web, you would need to:
1. Serve the app over HTTPS
2. Configure your server with these headers:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`

**For development, it's recommended to use Android or iOS instead.**

## 📱 Quick Start for Android/iOS

### Android
```bash
npm start
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

### iOS
```bash
npm start
# Press 'i' for iOS simulator (macOS only)
# Or scan QR code with Expo Go app
```

## 💡 Alternative: Use Android/iOS for Testing

The app is designed primarily for mobile use. For development and testing:
- Use **Android Emulator** or **Expo Go** on Android device
- Use **iOS Simulator** or **Expo Go** on iOS device

These platforms have full SQLite support and work perfectly!

