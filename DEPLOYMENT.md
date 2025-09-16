# Astral Notes - Deployment Guide

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Damatnic/ASTRAL_NOTES)

## 📋 Environment Variables (Optional)

To enable AI features, set these environment variables in your Vercel dashboard:

### Required for AI Features
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here  
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
VITE_ENABLE_AI_FEATURES=true
```

### Optional Configuration
```bash
VITE_AI_MODEL=gpt-3.5-turbo
VITE_AI_MAX_TOKENS=1000
VITE_AI_TEMPERATURE=0.7
VITE_ENABLE_DEBUG_MODE=false
```

## 🛠️ Manual Deployment Steps

### 1. Clone Repository
```bash
git clone https://github.com/Damatnic/ASTRAL_NOTES.git
cd ASTRAL_NOTES
```

### 2. Install Dependencies
```bash
cd client
npm install
```

### 3. Set Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env with your API keys (optional)
# VITE_OPENAI_API_KEY=your_key_here
# VITE_ENABLE_AI_FEATURES=true
```

### 4. Build for Production
```bash
npm run build
```

### 5. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🏗️ Supported Platforms

- **Vercel** (Recommended) - Zero configuration
- **Netlify** - Works with build command: `cd client && npm install && npm run build`
- **GitHub Pages** - Static hosting
- **Any Static Host** - Deploy the `client/dist` folder

## 🔧 Build Configuration

The project is configured for easy deployment:
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Node Version**: 18+

## 🌟 Features Available Without API Keys

Even without AI API keys, you get:
- ✅ Full project management
- ✅ Advanced note editor
- ✅ Real-time analytics
- ✅ Export/import functionality
- ✅ Focus writing modes
- ✅ Local data persistence

## 🤖 AI Features (With API Keys)

With API keys configured:
- 🧠 Real-time writing analysis
- 📝 Smart content suggestions
- 🎯 Grammar and style improvements
- ✨ AI-powered writing prompts
- 🔍 Tone analysis

## 🔐 Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- The app works fully offline without API keys
- All data is stored locally in browser storage

## 📱 Production Features

- Progressive Web App (PWA)
- Offline functionality
- Responsive design
- Hot module replacement in development
- Optimized build with code splitting