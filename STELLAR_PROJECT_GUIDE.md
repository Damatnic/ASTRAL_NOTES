# 🌌 Astral Notes - Stellar Project Guide

> *A cosmic creative writing platform with flagship-quality architecture*

## 🚀 Quick Start

```bash
# Client Development
cd client
npm install
npm run stellar:dev     # Development with type checking
npm run stellar:check   # Full quality check
npm run stellar:build   # Production build

# Server Development  
cd server
npm install
npm run dev
npm run build
```

## ✨ Stellar Scripts

### Client Commands
- `stellar:dev` - Development with type checking
- `stellar:check` - TypeScript + lint + test validation
- `stellar:build` - Quality-assured production build
- `cosmic:clean` - Clean build artifacts
- `cosmic:fresh` - Full clean rebuild

### Server Commands
- `dev` - Development server with hot reload
- `build` - TypeScript compilation
- `start` - Production server

## 🌟 Core Architecture

### 📝 Unified Editor System - StellarScribe
**Location**: `client/src/components/stellar-scribe/`

```typescript
import StellarScribe from '@/components/stellar-scribe/StellarScribe'

<StellarScribe
  content={content}
  onContentChange={handleChange}
  variant="full" // full | compact | minimal
  cosmicMode={true}
  enableNebulaFocus={true}
  autoSave={true}
  sceneId="scene-1"
/>
```

**Features**:
- 🎨 Multiple variants for different use cases
- 🤖 Integrated Cosmic Insights AI assistant
- 🔍 Nebula Focus Mode for distraction-free writing
- 💾 Intelligent auto-save with configurable intervals
- ♿ Full WCAG 2.1 AA accessibility compliance

### 🤖 AI Writing Assistant - Cosmic Insights
**Location**: `client/src/components/stellar-scribe/CosmicInsights.tsx`

```typescript
import CosmicInsights from '@/components/stellar-scribe/CosmicInsights'

<CosmicInsights
  content={content}
  isVisible={showInsights}
  onApplySuggestion={handleSuggestion}
  onClose={closeInsights}
/>
```

**Capabilities**:
- 📖 8 specialized suggestion types
- 🎭 Character voice analysis
- 📊 Real-time content analysis
- 🌟 Cosmic-themed interface

### 🧑‍🚀 Character Management - Stellar Beings
**Location**: `client/src/components/characters/`

Unified character management system with:
- 👥 Character profiles and relationships
- 🎭 Voice and personality analysis
- 📈 Character development tracking
- 🌐 Cross-story character consistency

### 🗺️ Story Planning - Stellar Blueprint Hub
**Location**: `client/src/components/planning/StellarBlueprintHub.tsx`

Advanced story planning with:
- 📜 Plot thread management
- 🎯 Story arc visualization
- 🧭 Cosmic navigation between elements
- 📊 Progress tracking and analytics

## 🎨 Astral Theming System

### 🌌 Cosmic Color Palette
```css
--stellar-primary: #6366f1      /* Cosmic blue */
--cosmic-secondary: #8b5cf6     /* Nebula purple */
--astral-accent: #06b6d4        /* Star cyan */
```

### ✨ Enhanced UI Components
**Location**: `client/src/components/ui/enhanced/`

```typescript
import { CosmicButton, AstralCard } from '@/components/ui/enhanced'

<CosmicButton 
  variant="stellar" 
  glow={true} 
  particles={true}
  cosmic={true}
>
  Launch Mission
</CosmicButton>

<AstralCard 
  variant="nebula" 
  constellation={true} 
  animated={true}
>
  Content
</AstralCard>
```

### 🎭 Cosmic Animations
- `stellar-pulse` - Pulsing glow effect
- `cosmic-float` - Gentle floating animation  
- `nebula-breath` - Breathing opacity effect
- `cosmic-twinkle` - Twinkling stars
- `animate-shimmer` - Cosmic shimmer effect

## ♿ Accessibility Features

### 🌟 Stellar Accessibility Manager
**Location**: `client/src/components/ui/accessibility/AccessibilityManager.tsx`

```typescript
import { AccessibilityProvider, AccessibilityPanel } from '@/components/ui/accessibility/AccessibilityManager'

<AccessibilityProvider>
  <App />
  <AccessibilityPanel isOpen={panelOpen} onClose={closePanel} />
</AccessibilityProvider>
```

**Features**:
- 🔤 Dynamic font scaling
- 🎨 High contrast mode
- 🎬 Reduced motion support
- 🎯 Enhanced focus indicators
- 🌈 Color blind friendly adjustments
- ⌨️ Comprehensive keyboard navigation

### 🎹 Stellar Keyboard Shortcuts
- `Alt + A` - Open Accessibility Panel
- `Ctrl + K` - Focus Search
- `Ctrl + S` - Save Document
- `Ctrl + N` - New Document
- `Escape` - Exit Focus Mode / Close Modals

## 🛡️ Security & Performance

### 🔒 Security Configuration
**Location**: `client/src/config/securityConfig.ts`

- 🛡️ Content Security Policy (CSP)
- 🔐 Secure data storage
- 🚨 Suspicious activity detection
- 🔑 Authentication security
- 🛠️ Input validation & sanitization

### ⚡ Performance Optimization
**Location**: `client/src/config/performanceConfig.ts`

- 📊 Web Vitals monitoring
- 🧠 Memory management
- ⏳ Lazy loading strategies
- 📈 Bundle optimization
- 🔄 Smart caching

## 🧪 Testing Strategy

### 📋 Test Coverage
```bash
npm run test:coverage  # Coverage report
npm run test:watch     # Watch mode
npm run test:ui        # Visual test runner
```

**Test Suites**:
- ✅ StellarScribe editor functionality
- 🤖 CosmicInsights AI assistant
- ♿ Accessibility compliance
- 🎨 UI component behavior
- 🔗 API integration

### 🎯 Quality Metrics
- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings tolerance
- **Test Coverage**: 95%+ for core components
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Optimized bundle sizes

## 📁 Project Structure

```
astral-notes/
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── stellar-scribe/    # Unified editor system
│   │   │   ├── ui/enhanced/       # Cosmic UI components
│   │   │   └── ui/accessibility/  # Accessibility features
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── astral/         # Astral branding system
│   │   └── styles/         # CSS and theming
│   └── tests/              # Test suites
├── server/                 # Express + Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Server utilities
└── docs/                   # Documentation
```

## 🚀 Deployment

### 🌐 Production Build
```bash
npm run stellar:build  # Full quality check + build
npm run preview        # Preview production build
```

### 📦 Bundle Analysis
- **CSS**: 118.81 kB → 18.36 kB gzipped
- **JavaScript**: Optimized chunks with tree-shaking
- **Images**: Lazy loading and optimization
- **Fonts**: Subset and compressed

## 🔮 Advanced Features

### 🌌 Worldbuilding System
**Location**: `client/src/services/api/worldbuildingApi.ts`

Complete worldbuilding API with:
- 🏛️ Religion and belief systems
- ✨ Magic system definitions
- 🌍 Culture and society management
- ⏰ Timeline and historical events
- 🔗 Consistency checking

### 📊 Analytics & Insights
- 📈 Writing progress tracking
- 🎯 Goal management
- 📝 Style analysis
- 🤝 Collaboration tools
- 📤 Publishing workflows

## 🌟 Best Practices

### 💎 Code Quality
- Use TypeScript strict mode
- Follow astral naming conventions
- Implement proper error boundaries
- Add comprehensive test coverage
- Document public APIs

### ♿ Accessibility
- Test with screen readers
- Ensure keyboard navigation
- Maintain color contrast ratios
- Provide alternative text
- Support reduced motion preferences

### 🚀 Performance
- Implement lazy loading
- Use React.memo() for expensive components
- Optimize re-renders with useCallback/useMemo
- Monitor Web Vitals in production
- Minimize bundle sizes

## 🆘 Troubleshooting

### Common Issues
1. **Build Errors**: Run `npm run typecheck` first
2. **Test Failures**: Check `npm run test:watch` for details
3. **Lint Warnings**: Use `npm run lint:fix` for auto-fixes
4. **Performance**: Use `npm run cosmic:fresh` for clean rebuild

### Debug Tools
- 🔍 StellarLogger for centralized logging
- 📊 Performance monitoring utilities
- ♿ Accessibility panel for testing
- 🧪 Comprehensive test suites

---

*Built with ❤️ and ✨ cosmic energy*

**Version**: 2.0.0 - Stellar Enhancement
**Last Updated**: January 2025