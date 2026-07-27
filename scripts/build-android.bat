@echo off
REM ═══════════════════════════════════════════════════════════════
REM  BETESEB — Android Production Build Script
REM  
REM  ምን ያደርጋል (What it does):
REM    1. Next.js ን static build ያደርጋል (next build)
REM    2. Web assets ን Android ፕሮጀክት ላይ ያዛምዳል (cap sync android)
REM    3. Android Studio ን ይከፍታል (cap open android)
REM
REM  አጠቃቀም (Usage):
REM    Double-click this file OR run from terminal:
REM    > scripts\build-android.bat
REM ═══════════════════════════════════════════════════════════════

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║   BETESEB Android Production Build        ║
echo  ╚═══════════════════════════════════════════╝
echo.

REM — Move to the project root (parent of scripts/)
cd /d "%~dp0.."

echo [1/3] Building Next.js (static export)...
echo ─────────────────────────────────────────
call npm run build
if errorlevel 1 (
    echo.
    echo  ❌ FAILED: Next.js build failed. Fix errors above and try again.
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing web assets to Android project...
echo ─────────────────────────────────────────────
call npx cap sync android
if errorlevel 1 (
    echo.
    echo  ❌ FAILED: Capacitor sync failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Opening Android Studio...
echo ─────────────────────────────
call npx cap open android

echo.
echo  ✅ Done! Android Studio is opening.
echo  ▶  Click Run in Android Studio to deploy to your device/emulator.
echo.
pause
