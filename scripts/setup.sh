#!/bin/bash

# Astral Notes Setup Script
echo "🚀 Setting up Astral Notes..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed and running."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Copy environment file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your database credentials and secrets"
else
    echo "✅ Environment file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd server && npm run db:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit server/.env with your database credentials"
echo "2. Run 'npm run db:migrate' to set up the database"
echo "3. (Optional) Run 'npm run db:seed' to add demo data"
echo "4. Run 'npm run dev' to start the development servers"
echo ""
echo "🌐 The app will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📚 Demo account (after seeding):"
echo "   Email: demo@astralnotes.com"
echo "   Password: demo123"
