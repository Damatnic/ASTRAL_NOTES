#!/bin/bash

# Vercel Deployment Script for ASTRAL_NOTES
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting ASTRAL_NOTES Vercel deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

print_status "Vercel CLI found"

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found. Are you in the ASTRAL_NOTES root directory?"
    exit 1
fi

print_status "Found vercel.json configuration"

# Install dependencies
print_status "Installing dependencies..."
npm run setup

# Type checking
print_status "Running type checks..."
npm run typecheck

# Build the project
print_status "Building the project..."
npm run build:vercel

# Check if user is logged into Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged into Vercel. Starting login process..."
    vercel login
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Check if this is the first deployment
if vercel ls | grep -q "astral-notes"; then
    print_status "Updating existing deployment..."
    vercel --prod
else
    print_status "Creating new deployment..."
    vercel --prod
fi

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "astral-notes" | head -1 | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    print_status "Deployment successful!"
    echo ""
    echo "🌐 Your app is live at: https://${DEPLOYMENT_URL}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Set up your environment variables in the Vercel dashboard"
    echo "2. Configure your database URL"
    echo "3. Test the deployment"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "   Dashboard: https://vercel.com/dashboard"
    echo "   Logs: vercel logs ${DEPLOYMENT_URL}"
    echo ""
    
    # Test the deployment
    print_status "Testing deployment health..."
    if curl -f "https://${DEPLOYMENT_URL}/api/health" > /dev/null 2>&1; then
        print_status "Health check passed!"
    else
        print_warning "Health check failed. Check your environment variables and database connection."
    fi
else
    print_error "Could not determine deployment URL"
fi

echo ""
print_status "Deployment script completed!"