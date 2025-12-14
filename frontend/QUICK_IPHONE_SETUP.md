# Quick Setup: Test on Your iPhone (No Xcode Needed!)

## This is the FASTEST way to test your app! ⚡

### Step 1: Install Expo Go on iPhone
1. Open **App Store** on your iPhone
2. Search for **"Expo Go"**
3. Install it (it's free)

### Step 2: Make sure iPhone and Mac are on same WiFi
- Both devices must be on the same WiFi network

### Step 3: Run your app
```bash
cd InvoiceGenerator/frontend
npm start
```

### Step 4: Scan QR Code
- **On iPhone**: Open **Camera app** and point at the QR code in terminal
- OR open **Expo Go app** and tap "Scan QR Code"
- The app will load on your iPhone!

## That's it! 🎉

Your app will run on your iPhone immediately. No Xcode installation needed!

## Troubleshooting

### QR code doesn't work?
- Make sure iPhone and Mac are on same WiFi
- Try typing the URL manually in Expo Go app
- Check that Expo server is running (you should see a QR code)

### Can't connect?
- Make sure firewall isn't blocking port 8081
- Try restarting Expo: `npm start -- --clear`

