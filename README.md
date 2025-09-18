# 🌌 Astral Notes - Cosmic Creative Writing Platform

> *Where stories are born among the stars*

## What's New

New Features:
- Comprehensive Story Editor for novels and long-form writing
- Chapter management with drag-and-drop organization
- Character tracking and development tools
- Plot structure and story outline management
- Timeline and world-building tools
- Story creation modal with guided setup

Enhanced Project Dashboard:
- Added 'Create New' dropdown with Story/Novel option
- Fixed note creation functionality
- Improved project content management options

Story Editor Features:
- Multi-chapter organization and navigation
- Character profiles with relationships and backstory
- Plot point tracking (inciting incident, climax, etc.)
- Word count tracking and writing goals
- Chapter status management (draft, review, complete)
- Rich text editing with story-specific toolbar
- Story metadata management (genre, synopsis, theme)

Technical Improvements:
- New StoryEditor page component
- CreateStoryModal with 3-step wizard
- Enhanced routing for story management
- Improved component architecture for long-form content

This update transforms ASTRAL_NOTES into a professional novel-writing platform with advanced story development tools.

A flagship-quality creative writing platform that transforms the writing experience with cosmic intelligence, stellar organization, and nebula-powered creativity. Astral Notes provides everything writers need to craft compelling narratives across the universe of imagination.

[![Build Status](https://img.shields.io/badge/build-stellar-blue)](#)
[![TypeScript](https://img.shields.io/badge/powered%20by-TypeScript-blue)](#)
[![Accessibility](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-green)](#)
[![Performance](https://img.shields.io/badge/performance-optimized-brightgreen)](#)

## ✨ Stellar Features

### 🌟 StellarScribe - Unified Editor System
- **Cosmic Intelligence** - Integrated AI writing assistant with 8 specialized suggestion types
- **Nebula Focus Mode** - Distraction-free writing with cosmic ambiance
- **Multi-Variant Interface** - Full, compact, and minimal modes for every writing style
- **Stellar Auto-Save** - Intelligent saving with configurable intervals
- **Cosmic Theming** - Beautiful star-field backgrounds and constellation effects
- **Voice-to-Text** with cosmic punctuation and stellar language support
- **Real-time Collaboration** with cosmic conflict resolution

### 🤖 Cosmic Insights - AI Writing Assistant
- **8 Specialized Engines**: Style Enhancement, Narrative Flow, Character Depth, Dialogue Polish
- **Atmospheric Details** - Environmental descriptions with sensory immersion
- **Emotional Resonance** - Character emotion and reader connection analysis
- **Tension Building** - Pacing and dramatic structure optimization
- **World Expansion** - Setting development and consistency checking
- **Stellar Analysis Dashboard** with readability and sentiment scoring

### 📊 Professional Style Analysis
- **Readability Scoring** with grade-level assessment
- **Sentence Structure Analysis** with variety metrics
- **Passive Voice Detection** with improvement suggestions
- **Vocabulary Richness** assessment
- **Dialogue Tag Analysis** for natural conversation
- **Pacing Analysis** with tension curve visualization
- **Repetition Detection** with synonym suggestions
- **Cliché Identification** and alternatives

### 📈 Comprehensive Writing Analytics
- **Manuscript Overview** with key metrics
- **Character Screen Time** and development tracking
- **POV Distribution** analysis
- **Three-Act Structure** breakdown
- **Plot Point Identification** with strength assessment
- **Theme Analysis** with symbolism detection
- **Writing Style Metrics** with professional benchmarks
- **Productivity Tracking** with session goals

### 🎯 Writing Goals & Milestones
- **Session Goals** (word count, time, pages)
- **Achievement System** with unlockable milestones
- **Progress Tracking** with visual indicators
- **Writing Speed Analysis** (WPM, accuracy)
- **Historical Data** with trend analysis
- **Productivity Insights** with improvement suggestions

### 🗂️ Intelligent Manuscript Organization
- **Hierarchical Outliner** with drag-and-drop reordering
- **Scene Navigation** with quick jump functionality
- **Character & Location Tracking** in scenes
- **Status Management** (Draft, Review, Final)
- **Advanced Filtering** by type, status, and level
- **Search & Navigation** with instant results
- **Word Count Tracking** at all levels

### 🎨 Visual Story Planning
- **Interactive Plotboard** with drag-and-drop nodes
- **Dual Timeline System** (chronological vs. narrative)
- **Character Arc Visualization** with relationship mapping
- **Scene Dependencies** with conflict detection
- **Subplot Management** with swimming lanes
- **Visual Story Structure** with act divisions

### 🔗 Advanced Linking System
- **Wiki-style Links** with `[[double bracket]]` syntax
- **Backlink Tracking** with relationship visualization
- **Link Previews** on hover with content snippets
- **Dead Link Detection** with suggestions
- **Fuzzy Link Matching** with auto-completion
- **Cross-references** between all content types

### 📚 Professional Templates
- **Genre-Specific Templates** for different story types
- **Character Sheets** with detailed development prompts
- **Scene Templates** with structure guidelines
- **Project Templates** for various writing formats
- **Custom Template Creation** with reusable components

### 📤 Publishing-Ready Export
- **Multiple Formats** (DOCX, PDF, ePub, Markdown)
- **Professional Formatting** with industry standards
- **Manuscript Preparation** for submission
- **Custom Styling** options for different publishers
- **Batch Export** for multiple documents

### ⚡ Performance & Accessibility
- **Real-time Collaboration** with WebSocket support
- **Offline Capability** with local storage sync
- **Keyboard Shortcuts** for all major functions
- **Screen Reader Support** with ARIA labels
- **Responsive Design** for all device types
- **Error Boundaries** with graceful failure handling
- **Toast Notifications** with contextual feedback

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Redux Toolkit** for state management
- **TipTap Editor** for rich text editing
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **React Router** for client-side routing
- **Socket.io Client** for real-time features

### Backend Stack
- **Node.js** with Express framework
- **PostgreSQL** database with Prisma ORM
- **JWT Authentication** with refresh tokens
- **WebSocket Support** for collaboration
- **File Upload** with cloud storage integration
- **RESTful API** with comprehensive endpoints

### Advanced Features
- **Fuzzy Search** with Levenshtein distance
- **Debounced Operations** for performance
- **Optimistic Updates** for responsive UI
- **Error Handling** with retry mechanisms
- **Data Validation** with Zod schemas
- **Security** with CORS and rate limiting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/astral-notes.git
   cd astral-notes
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Configure your database and API keys in .env files
   ```

4. **Database Setup**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📖 User Guide

### Getting Started with Writing
1. **Create a New Project** - Set up your story structure
2. **Define Characters & Locations** - Build your story world
3. **Create Story Outline** - Plan your narrative structure
4. **Write Scenes** - Use the advanced editor with AI assistance
5. **Track Progress** - Monitor your writing goals and analytics
6. **Export & Publish** - Prepare your manuscript for submission

### Advanced Workflows
- **Collaborative Writing** - Invite co-authors and editors
- **Version Control** - Track changes and revert when needed
- **Template Usage** - Speed up creation with pre-built structures
- **Analytics Review** - Analyze your writing for improvement opportunities
- **Professional Formatting** - Prepare manuscripts for different publishers

## 🛠️ Development

### Project Structure
```
astral-notes/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API and external services
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Server utilities
│   │   └── services/      # Business logic services
│   ├── prisma/            # Database schema and migrations
└── scripts/               # Setup and deployment scripts
```

### Key Components
- **AdvancedManuscriptEditor** - Professional writing interface
- **AIWritingAssistant** - AI-powered writing suggestions
- **StyleAnalysisPanel** - Real-time writing analysis
- **ManuscriptAnalytics** - Comprehensive story metrics
- **PlotboardCanvas** - Visual story planning
- **TimelineSystem** - Dual timeline management

### API Endpoints
- **Authentication** - `/api/auth/*`
- **Projects** - `/api/projects/*`
- **Stories & Scenes** - `/api/stories/*`, `/api/scenes/*`
- **Characters & Locations** - `/api/characters/*`, `/api/locations/*`
- **Analytics** - `/api/analytics/*`
- **Export/Import** - `/api/export/*`, `/api/import/*`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d --build
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - AI features (optional)
- `UPLOAD_STORAGE` - File storage configuration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional Commits for commit messages
- Unit tests for all new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by professional writing tools like Scrivener
- Community feedback from professional authors
- Open source libraries that made this possible

## 📞 Support

- **Documentation**: [docs.astral-notes.com](https://docs.astral-notes.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/astral-notes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/astral-notes/discussions)
- **Email**: support@astral-notes.com

---

**Astral Notes** - Empowering writers to create extraordinary stories. ✨
