@echo off
REM ═══════════════════════════════════════════════════════════════
REM  BETESEB — Android Live Reload Dev Mode
REM
REM  ምን ያደርጋል (What it does):
REM    Next.js dev server ን ያስጀምራል + Android device/emulator ላይ
REM    live reload ን ያስቻላል። ኮድ ሲቀይሩ ወዲያው app ላይ ይታያሉ።
REM
REM  ቅድም ሁኔታ (Prerequisites):
REM    • Android device (USB debugging on) ወይም emulator running
REM    • .env.local ውስጥ CAPACITOR_LIVE_RELOAD=true ያዋቅሩ
REM    • .env.local ውስጥ DEV_SERVER_URL=http://YOUR_IP:3000 ያዋቅሩ
REM      (YOUR_IP = ከ "ipconfig" ትዕዛዝ IPv4 Address)
REM
REM  አጠቃቀም:
REM    > scripts\dev-android.bat
REM ═══════════════════════════════════════════════════════════════

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║   BETESEB Android Live Reload Dev Mode    ║
echo  ╚═══════════════════════════════════════════╝
echo.

cd /d "%~dp0.."

REM — Check if .env.local has live reload enabled
findstr /c:"CAPACITOR_LIVE_RELOAD=true" .env.local >nul 2>&1
if errorlevel 1 (
    echo  ⚠️  WARNING: CAPACITOR_LIVE_RELOAD=true not found in .env.local
    echo.
    echo  Please add these lines to your .env.local:
    echo    CAPACITOR_LIVE_RELOAD=true
    echo    DEV_SERVER_URL=http://YOUR_LOCAL_IP:3000
    echo.
    echo  To find your IP: open a new terminal and run "ipconfig"
    echo  Look for "IPv4 Address" under your WiFi adapter.
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 0
)

echo [1/2] Syncing Capacitor config (live reload mode)...
call npx cap sync android
if errorlevel 1 (
    echo  ❌ FAILED: Capacitor sync failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting Live Reload on Android...
echo ─────────────────────────────────────────────────────────────
echo  ℹ  Make sure your device/emulator is connected and visible via ADB.
echo  ℹ  Web changes will instantly appear on the device without rebuilding.
echo.
call npx cap run android --livereload --external

pause
