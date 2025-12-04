@echo off
REM Script to set up ADB port forwarding for Android emulator
REM This allows the emulator to access the host machine's localhost:3000

echo ========================================
echo Android Emulator Port Forwarding Setup
echo ========================================
echo.
echo This script will configure your Android emulator to access
echo the backend server running on your host machine at port 3000.
echo.

REM Check if adb is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB not found in PATH
    echo.
    echo Please ensure Android SDK Platform Tools are installed and added to PATH.
    echo You can install them via Android Studio SDK Manager.
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking ADB devices...
adb devices
echo.

echo [2/3] Setting up reverse port forwarding...
echo Running: adb reverse tcp:3000 tcp:3000
adb reverse tcp:3000 tcp:3000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/3] SUCCESS! Port forwarding configured.
    echo.
    echo ========================================
    echo Configuration Complete
    echo ========================================
    echo.
    echo Your Android emulator can now access the backend at:
    echo   http://10.0.2.2:3000
    echo.
    echo This mapping forwards emulator requests to:
    echo   http://localhost:3000 (your host machine)
    echo.
    echo NOTE: You need to run this script each time you restart the emulator.
    echo.
) else (
    echo.
    echo ERROR: Failed to set up port forwarding
    echo.
    echo Troubleshooting:
    echo 1. Make sure the Android emulator is running
    echo 2. Check that only one emulator instance is running
    echo 3. Try restarting the emulator
    echo 4. Run 'adb devices' to verify the emulator is detected
    echo.
)

echo.
echo Press any key to exit...
pause >nul
