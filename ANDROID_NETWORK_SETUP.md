# Android Emulator Network Configuration

## Problem
When running the React Native app on an Android emulator, you may encounter network errors when trying to connect to the backend server running on your host machine.

**Error Example:**
```
[API Network Error] No response received
Save Invoice Error: AxiosError: Network Error
```

## Root Cause
Android emulators run in a virtualized environment with their own network stack. The emulator cannot access `localhost` or `127.0.0.1` on the host machine directly.

## Solutions

### Solution 1: ADB Reverse Port Forwarding (Recommended)

This is the **easiest and most reliable** solution for development.

#### Quick Setup
1. **Run the setup script:**
   ```bash
   .\setup-android-network.bat
   ```

2. **Or manually run:**
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```

This command tells the Android emulator to forward any requests to `localhost:3000` (on the emulator) to `localhost:3000` on your host machine.

#### Important Notes
- ✅ You need to run this **each time you restart the emulator**
- ✅ The backend server must be running on port 3000
- ✅ Works for both physical devices and emulators (when connected via USB)

### Solution 2: Use Special IP Address (Already Configured)

The app is already configured to use `10.0.2.2` which is a special IP address that Android emulators use to access the host machine's `localhost`.

**Configuration in `frontend/src/config/api.ts`:**
```typescript
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',  // ✅ Already set
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});
```

However, this may not work if:
- Windows Firewall is blocking port 3000
- Backend is not listening on `0.0.0.0` (it should be)

### Solution 3: Windows Firewall Configuration

If `10.0.2.2` doesn't work, you may need to allow port 3000 through Windows Firewall:

1. **Open Windows Defender Firewall**
2. **Click "Advanced settings"**
3. **Click "Inbound Rules" → "New Rule"**
4. **Select "Port" → Next**
5. **Select "TCP" and enter port `3000` → Next**
6. **Select "Allow the connection" → Next**
7. **Apply to all profiles → Next**
8. **Name it "Node.js Backend Port 3000" → Finish**

### Solution 4: Use Your Machine's Network IP (For Physical Devices)

If testing on a physical device on the same WiFi network:

1. **Find your machine's IP address:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.100`)

2. **Update the fallback URLs in `frontend/src/config/api.ts`:**
   ```typescript
   export const API_FALLBACK_URLS = [
     'http://10.0.2.2:3000',
     'http://localhost:3000',
     'http://192.168.1.100:3000', // ✅ Replace with your IP
   ];
   ```

3. **Ensure backend is listening on `0.0.0.0`** (already configured in `backend/src/index.ts`)

## Testing the Connection

The app includes a built-in connection tester:

1. **Open the Invoice Form**
2. **Scroll to the bottom**
3. **Tap "🔌 Test Backend Connection"**

This will:
- Try the primary URL
- Automatically try fallback URLs if primary fails
- Show which URL works
- Provide troubleshooting tips

## Verification Checklist

Before trying to save an invoice, verify:

- [ ] Backend server is running: `npm run dev` in `backend/` directory
- [ ] Backend shows: `✅ Server running on http://localhost:3000`
- [ ] Android emulator is running
- [ ] ADB reverse port forwarding is set up: `adb reverse tcp:3000 tcp:3000`
- [ ] Test connection button shows "✅ Connection Successful"

## Common Issues

### Issue: "Cannot reach backend"
**Solution:** Run `adb reverse tcp:3000 tcp:3000`

### Issue: "Connection timeout"
**Solution:** 
1. Check backend is running
2. Check Windows Firewall settings
3. Restart the emulator and run ADB reverse again

### Issue: "ADB not found"
**Solution:** 
1. Install Android SDK Platform Tools via Android Studio
2. Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

### Issue: "No devices/emulators found"
**Solution:**
1. Start the Android emulator
2. Run `adb devices` to verify it's detected
3. If not detected, restart ADB: `adb kill-server` then `adb start-server`

## Backend Configuration

The backend is already configured correctly in `backend/src/index.ts`:

```typescript
const PORT = process.env.PORT ?? 3000;
const HOST = "0.0.0.0"; // ✅ Listens on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Also accessible on http://0.0.0.0:${PORT}`);
  console.log(`✅ Android emulator can access via http://10.0.2.2:${PORT}`);
});
```

## Automated Fallback

The app now includes automatic fallback logic:

1. **Tries primary URL** (`http://10.0.2.2:3000`)
2. **If that fails, tries fallback URLs** automatically
3. **Updates to use the working URL** for subsequent requests

This is handled in `frontend/src/config/apiClient.ts` with the `apiRequestWithFallback` function.

## Quick Reference

| Environment | URL to Use |
|-------------|------------|
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://localhost:3000` |
| Physical Device (same WiFi) | `http://YOUR_IP:3000` |
| Web Browser | `http://localhost:3000` |

## Need Help?

If you're still experiencing issues:

1. Check the React Native DevTools console for detailed error messages
2. Check the backend terminal for incoming request logs
3. Run the connection test in the app
4. Verify all steps in the checklist above
