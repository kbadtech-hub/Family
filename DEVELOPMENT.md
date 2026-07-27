# Beteseb — Developer Setup Guide
**አዘጋጅ መምሪያ | Development Guide**

---

## 📋 ዝርዝር / Overview

Beteseb is a **Next.js + Capacitor** hybrid app:
- **Web**: Next.js (TypeScript) hosted on Vercel → `beteseb1.online`
- **Android**: Capacitor shell wrapping the web app (opened in Android Studio)
- **iOS**: Capacitor shell (requires macOS + Xcode — see iOS section)

```
src/          ← Next.js web code (TypeScript/React)
android/      ← Android Studio project (Capacitor generated)
ios/          ← Xcode project (Capacitor generated — macOS only)
capacitor.config.ts  ← Main Capacitor configuration
```

---

## ⚡ ፈጣን ጀምር / Quick Start

### Option A — Production Build (ምርት ቅጅ)
```
scripts\build-android.bat
```
> Web ን build ያደርጋል → Android ን sync ያደርጋል → Android Studio ይከፈታል

### Option B — Live Reload Dev Mode (ቀጥተኛ ዘዴ)
```
scripts\dev-android.bat
```
> ኮድ ሲቀይሩ ወዲያው Android device/emulator ላይ ይታያሉ

---

## 🔧 ቅድሚ ሁኔታ / Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Node.js | ≥ 18 | https://nodejs.org |
| Android Studio | Hedgehog+ | https://developer.android.com/studio |
| Java JDK | 17+ | (Auto-installed with Android Studio) |
| Android SDK | API 36 | (Install via Android Studio SDK Manager) |
| ADB | any | (Included with Android SDK) |

---

## 🤖 Android Studio Setup (ሙሉ ዝርዝር)

### ደረጃ 1 — Node Modules ን ጫን
```powershell
cd C:\Users\KB\Desktop\Beteseb\Family
npm install
```

### ደረጃ 2 — Android SDK ን አረጋግጥ
Android Studio ን ክፈቱ → **SDK Manager** → ያረጋግጡ:
- ✅ Android 14 (API 34) ወይም Android 15 (API 35/36)
- ✅ Android SDK Build-Tools
- ✅ Android Emulator
- ✅ Android SDK Platform-Tools

### ደረጃ 3 — Production Build ን ያካሂዱ
```powershell
npm run build:android
```
ወይም ቀጥተኛ batch file ን ሁለቴ ይጫኑ:
```
scripts\build-android.bat
```

### ደረጃ 4 — Android Studio ላይ Run ያካሂዱ
1. Android Studio ሲከፈት **"Sync Project with Gradle Files"** ን ጠብቁ
2. Device/Emulator ን ይምረጡ (toolbar ላይ)
3. ▶ **Run** ን ይጫኑ

---

## ⚡ Live Reload Setup (ቀጥተኛ ዘዴ)

Live Reload ሲጠቀሙ — React component ሲቀይሩ ወዲያው app ላይ ያያሉ (rebuild ሳያስፈልግ)።

### ደረጃ 1 — Local IP ን ያግኙ
```powershell
ipconfig
```
"IPv4 Address" ን ያስቀምጡ (ለምሳሌ: `192.168.1.105`)

### ደረጃ 2 — `.env.local` ን ያዋቅሩ
`.env.local` ፋይሉን ክፈቱ እና እነዚህን ይጨምሩ:
```env
CAPACITOR_LIVE_RELOAD=true
DEV_SERVER_URL=http://192.168.1.105:3000
```
> ⚠️ **YOUR_IP** ን ከ ipconfig ካገኟቸው IPv4 Address ጋር ይቀይሩ!

### ደረጃ 3 — Device ን ያዘጋጁ
**Physical Phone:**
- USB cable ን ያስፈናሉ
- Settings → Developer Options → **USB Debugging: ON**
- ADB ን ያረጋግጡ: `adb devices` (device name ማሳየት አለበት)

**Emulator:**
- Android Studio → Device Manager → Start Emulator

### ደረጃ 4 — Live Reload ን ያስጀምሩ
```powershell
scripts\dev-android.bat
```
ወይም:
```powershell
npm run dev:android
```

> ✅ አሁን `src/` ውስጥ ፋይሎችን ሲቀይሩ ወዲያው phone/emulator ላይ ያያሉ!

---

## 📦 Deploy Workflow (ሙሉ Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Web Change         npm run dev:android                      │
│  (React/CSS)    →   (Live Reload — instant!)                 │
│                                                              │
│  Plugin Change      npm run build:android                    │
│  (Capacitor)    →   (Full rebuild needed)                    │
│                                                              │
│  New Package        npm install [pkg]                        │
│  (npm)          →   npm run build:android                    │
│                                                              │
│  Production         npm run build:android                    │
│  Release        →   → Android Studio → Build → APK/AAB       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📜 ሁሉም Scripts

| Script | ምን ያደርጋል | አጠቃቀም |
|--------|-----------|--------|
| `npm run build:android` | Build + Sync + Open Studio | Production |
| `npm run dev:android` | Live Reload on Android | Development |
| `npm run sync:android` | Sync only (no build) → open Studio | Quick sync |
| `npm run build` | Next.js build only | — |
| `npm run dev` | Web dev server (browser) | Web testing |
| `npm run cap:sync` | Sync both platforms | — |
| `scripts\build-android.bat` | Same as `build:android` | Double-click |
| `scripts\dev-android.bat` | Same as `dev:android` | Double-click |

---

## 🍎 iOS / Xcode (macOS ሲኖር)

> ⚠️ Xcode macOS ብቻ ነው። ዊንዶዝ ላይ iOS ልትሰሩ አይቻልም።

macOS ካለ (ወደፊት):
```bash
# macOS terminal ላይ:
npm install
npm run build:ios
# → Xcode ይከፈታል
```

`Package.swift` ቀድሞ macOS-compatible paths ተዋቅሯል (forward slashes)።

---

## 🔧 VS Code Tasks (ፈጣን access)

**Terminal → Run Task…** (Ctrl+Shift+P → "Run Task"):

- `🤖 Android: Build + Sync + Open Studio`
- `🔄 Android: Sync Only (no build)`
- `⚡ Android: Live Reload Dev Mode`
- `🌐 Web: Start Dev Server (Next.js)`
- `📦 Build: Next.js Only`
- `🔁 Cap Sync: Both Platforms`

---

## 🐛 የተለመዱ ችግሮች / Troubleshooting

### "SDK not found" error
```powershell
# android/local.properties ን ያረጋግጡ:
sdk.dir=C\:\\Users\\KB\\AppData\\Local\\Android\\Sdk
```

### "adb devices" shows nothing
- USB cable ን ይቀይሩ
- Phone ላይ USB Debugging ON እንደሆነ ያረጋግጡ
- Phone ስክሪን ን ክፍት ያድርጉ (ADB connection prompt ሊወጣ ይችላሉ)

### Live Reload does not connect
- Phone/Emulator ከኮምፒዩተር ጋር አንድ WiFi ላይ ናቸው ወይ?
- `.env.local` ውስጥ IP address ትክክለኛ ነው ወይ? (`ipconfig` ን ያካሂዱ)
- Windows Firewall ፖርት 3000 ን ዘጊቶ ሊሆን ይችላሉ:
  ```
  Windows Firewall → Allow an app → Add: node.exe
  ```

### Gradle build failed
```powershell
# Android ን ሙሉ ን clean ያድርጉ:
cd android
.\gradlew clean
cd ..
npm run build:android
```

### "Module not found" after npm install
```powershell
npm run build:android   # ← ሁሌ full build ያስፈልጋሉ
```

---

## 📁 ፕሮጀክት አወቃቀር / Project Structure

```
Beteseb/Family/
├── src/                    ← Next.js web source
│   ├── app/               ← Pages (App Router)
│   │   ├── [locale]/      ← Internationalized routes
│   │   │   ├── login/     ← Login page
│   │   │   ├── dashboard/ ← Main app
│   │   │   └── ...
│   │   └── api/           ← Backend API routes
│   ├── components/        ← React components
│   ├── lib/               ← Firebase, Supabase utilities
│   └── context/           ← Auth, UI context providers
│
├── android/               ← Android Studio project
│   └── app/src/main/
│       ├── java/com/beteseb/app/MainActivity.java
│       ├── res/values/styles.xml   ← Splash screen theme
│       └── AndroidManifest.xml
│
├── ios/                   ← Xcode project (macOS only)
│   └── App/
│       ├── App/AppDelegate.swift
│       └── CapApp-SPM/Package.swift
│
├── capacitor.config.ts    ← Capacitor config (Live Reload toggle)
├── next.config.ts         ← Next.js config
├── package.json           ← Scripts + dependencies
├── .env.local             ← Environment variables (DO NOT COMMIT)
└── scripts/
    ├── build-android.bat  ← One-click production build
    └── dev-android.bat    ← One-click live reload
```

---

*Last updated: 2026-07-27*
