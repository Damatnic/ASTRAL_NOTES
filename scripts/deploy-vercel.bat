@echo off
REM Vercel Deployment Script for ASTRAL_NOTES (Windows)
REM This script automates the deployment process

echo 🚀 Starting ASTRAL_NOTES Vercel deployment...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Vercel CLI is not installed. Install it with: npm i -g vercel
    exit /b 1
)

echo ✓ Vercel CLI found

REM Check if we're in the right directory
if not exist "vercel.json" (
    echo ✗ vercel.json not found. Are you in the ASTRAL_NOTES root directory?
    exit /b 1
)

echo ✓ Found vercel.json configuration

REM Install dependencies
echo ✓ Installing dependencies...
call npm run setup
if %errorlevel% neq 0 (
    echo ✗ Failed to install dependencies
    exit /b 1
)

REM Type checking
echo ✓ Running type checks...
call npm run typecheck
if %errorlevel% neq 0 (
    echo ✗ Type checking failed
    exit /b 1
)

REM Build the project
echo ✓ Building the project...
call npm run build:vercel
if %errorlevel% neq 0 (
    echo ✗ Build failed
    exit /b 1
)

REM Check if user is logged into Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Not logged into Vercel. Starting login process...
    vercel login
)

REM Deploy to Vercel
echo ✓ Deploying to Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo ✗ Deployment failed
    exit /b 1
)

echo.
echo ✓ Deployment successful!
echo.
echo 📝 Next steps:
echo 1. Set up your environment variables in the Vercel dashboard
echo 2. Configure your database URL
echo 3. Test the deployment
echo.
echo 📊 Monitor your deployment:
echo    Dashboard: https://vercel.com/dashboard
echo.
echo ✓ Deployment script completed!