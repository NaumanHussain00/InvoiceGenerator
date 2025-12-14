# iOS Setup Guide for MacBook

## Step 1: Install Xcode

1. **Open the App Store** on your Mac
2. **Search for "Xcode"**
3. **Click "Get" or "Install"** (it's free but large ~15GB, so it may take a while)
4. **Wait for installation to complete**

## Step 2: Accept Xcode License

After installation, open Terminal and run:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

## Step 3: Install iOS Simulator

1. **Open Xcode** (from Applications or Spotlight)
2. Go to **Xcode → Settings → Platforms** (or **Preferences → Components**)
3. Download **iOS Simulator** if not already installed

## Step 4: Run Your App

### Option A: Using Expo (Easiest)

1. **Navigate to your project:**
   ```bash
   cd InvoiceGenerator/frontend
   ```

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Press `i`** in the Expo terminal to open iOS simulator

   OR

4. **Manually open iOS Simulator first:**
   ```bash
   open -a Simulator
   ```
   Then press `i` in Expo terminal

### Option B: Direct iOS Command

```bash
cd InvoiceGenerator/frontend
npm run ios
```

## Quick Commands

```bash
# Start Expo and open iOS
cd InvoiceGenerator/frontend
npm start
# Then press 'i'

# Or directly
npm run ios

# Open iOS Simulator manually
open -a Simulator
```

## Troubleshooting

### "xcode-select: error"
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### "No simulators found"
1. Open Xcode
2. Go to **Xcode → Settings → Platforms**
3. Download iOS Simulator

### "CocoaPods not found" (if you see this)
```bash
sudo gem install cocoapods
cd InvoiceGenerator/frontend/ios
pod install
```

### Simulator won't start
1. Open Xcode
2. Go to **Window → Devices and Simulators**
3. Click **+** to add a simulator
4. Choose iPhone model and iOS version

## First Time Setup

If this is your first time:
1. Install Xcode from App Store (15-30 minutes)
2. Open Xcode once to accept license
3. Run: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
4. Then run: `npm run ios`

## Notes

- ✅ iOS Simulator works great for development
- ✅ You can test on physical iPhone using Expo Go app
- ✅ Simulator supports all iOS features except some hardware-specific ones
- ⚠️ First Xcode installation can take 15-30 minutes

