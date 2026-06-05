@echo off
echo ================================
echo  Peshraft Library Admin Setup
echo ================================
echo.
echo Step 1: Installing all packages...
call npm install
echo.
echo Step 2: Installing Firebase...
call npm install firebase
echo.
echo ================================
echo  DONE! Now do this:
echo  1. Open src/firebase/config.ts
echo  2. Paste your Firebase config
echo  3. Then run: npm run dev
echo ================================
pause
