# Install Xcode on MacBook

## Current Status
You have Command Line Tools installed, but you need **full Xcode** to run iOS Simulator.

## Step-by-Step Installation

### Step 1: Open App Store
1. Click the **Apple menu** (🍎) in top-left
2. Click **App Store**
3. OR I just opened it for you - look for the App Store window

### Step 2: Install Xcode
1. In App Store, **search for "Xcode"**
2. Click the **Xcode** app (made by Apple)
3. Click **"Get"** or **"Install"** button
4. Enter your Apple ID password if prompted

### Step 3: Wait for Installation
- ⏱️ **This will take 15-30 minutes** (Xcode is ~15GB)
- You can continue using your Mac while it downloads
- Check progress in App Store → Purchased tab

### Step 4: After Installation
Once Xcode is installed, run these commands:

```bash
# Switch to Xcode (not Command Line Tools)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
sudo xcodebuild -license accept

# Verify installation
xcodebuild -version
```

### Step 5: Open Xcode Once
1. Open **Xcode** from Applications folder
2. It will ask to install additional components - click **"Install"**
3. Wait for components to install (5-10 minutes)

### Step 6: Run Your App
After everything is installed:

```bash
cd InvoiceGenerator/frontend
npm start
# Then press 'i' for iOS simulator
```

## Alternative: Use Physical iPhone (Faster!)

While Xcode downloads, you can test on your iPhone:

1. **Install Expo Go** on your iPhone from App Store
2. **Run your app:**
   ```bash
   cd InvoiceGenerator/frontend
   npm start
   ```
3. **Scan the QR code** with your iPhone camera or Expo Go app

This works immediately - no Xcode needed!

## Quick Check Commands

```bash
# Check if Xcode is installed
ls /Applications/Xcode.app

# Check Xcode version (after installation)
xcodebuild -version

# List available iOS simulators (after installation)
xcrun simctl list devices
```

## Troubleshooting

### If App Store says "Open" instead of "Get"
- Xcode is already installed! Just need to configure it:
  ```bash
  sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
  ```

### If installation is stuck
- Check your internet connection
- Make sure you have enough disk space (need ~20GB free)
- Try restarting App Store

### If you get permission errors
- Make sure you're using `sudo` for the xcode-select command
- Enter your Mac password when prompted

