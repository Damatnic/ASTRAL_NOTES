@echo off
echo 🚀 Setting up Astral Notes...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

echo 📦 Installing server dependencies...
cd server
call npm install
cd ..

echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

REM Copy environment file if it doesn't exist
if not exist "server\.env" (
    echo 📝 Creating environment file...
    copy "server\env.example" "server\.env"
    echo ⚠️  Please edit server\.env with your database credentials and secrets
) else (
    echo ✅ Environment file already exists
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
cd server
call npm run db:generate
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit server\.env with your database credentials
echo 2. Run 'npm run db:migrate' to set up the database
echo 3. (Optional) Run 'npm run db:seed' to add demo data
echo 4. Run 'npm run dev' to start the development servers
echo.
echo 🌐 The app will be available at:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo 📚 Demo account (after seeding):
echo    Email: demo@astralnotes.com
echo    Password: demo123
