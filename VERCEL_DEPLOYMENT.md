# Vercel Deployment Guide for ASTRAL_NOTES

This guide provides complete instructions for deploying the ASTRAL_NOTES full-stack application to Vercel.

## 📋 Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed globally: `npm i -g vercel`
- A Vercel account ([sign up here](https://vercel.com/signup))
- A PostgreSQL database (recommended for production)
- Basic familiarity with environment variables

## 🏗️ Project Structure

```
ASTRAL_NOTES/
├── client/                 # React/Vite frontend
├── server/                 # Node.js/Express backend
│   ├── src/               # Original server code
│   └── api/               # Vercel serverless function
├── vercel.json            # Vercel configuration
├── package.json           # Root package.json with build scripts
└── .env.vercel.example    # Environment variables template
```

## 🚀 Quick Deployment

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd ASTRAL_NOTES
npm run setup
```

### 2. Database Setup

Create a PostgreSQL database using one of these providers:
- [Neon](https://neon.tech/) (Recommended)
- [PlanetScale](https://planetscale.com/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)

### 3. Environment Variables

Copy the environment template and configure:

```bash
cp .env.vercel.example .env.production
```

Edit `.env.production` with your actual values:

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGIN=https://your-app.vercel.app
```

### 4. Deploy to Vercel

```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy (follow the prompts)
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN

# Redeploy with environment variables
vercel --prod
```

## 📝 Detailed Configuration

### Vercel Configuration (`vercel.json`)

The project includes a pre-configured `vercel.json` that:

- **Builds the client** using Vite static build
- **Deploys the server** as a serverless function
- **Routes API calls** to `/api/*` endpoints
- **Serves the frontend** for all other routes
- **Sets security headers** for production
- **Configures CORS** for API endpoints

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-32-char-secret-key` |
| `CORS_ORIGIN` | Frontend domain for CORS | `https://your-app.vercel.app` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |

### Build Process

The build process is handled by these scripts:

1. **`npm run setup`** - Installs all dependencies
2. **`npm run build:vercel`** - Builds client, server, and generates Prisma client
3. **`npm run db:generate`** - Generates Prisma client for database

## 🗄️ Database Configuration

### Prisma for Serverless

The application is configured for serverless deployment with:

- **Connection pooling** optimization
- **Automatic client generation** during build
- **Environment-based database URLs**

### Migration in Production

```bash
# Generate Prisma client
npm run db:generate

# For initial deployment or schema changes:
# Run migrations locally first, then deploy
npm run db:migrate
```

## 🔧 API Configuration

### Serverless Function (`server/api/index.ts`)

The API is configured as a single Vercel serverless function that:

- **Handles all API routes** under `/api/*`
- **Manages database connections** efficiently
- **Implements security middleware** (CORS, rate limiting, helmet)
- **Provides error handling** for production

### Client API Configuration (`client/src/config/api.ts`)

The client automatically detects the environment and configures:

- **Development**: Points to `http://localhost:8000/api`
- **Production**: Uses relative URLs `/api` (leveraging Vercel routing)

## 🔐 Security Features

### Production Security

- **Helmet.js** for security headers
- **CORS** configuration for frontend domain
- **Rate limiting** to prevent abuse
- **JWT authentication** for API endpoints
- **Input validation** with Zod schemas

### Environment Security

- **Secure environment variables** in Vercel dashboard
- **No sensitive data** in client-side code
- **Proper CORS** origin restrictions

## 🚦 Testing Deployment

### 1. Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production"
}
```

### 2. Frontend Test

Visit `https://your-app.vercel.app` and verify:
- ✅ Page loads without errors
- ✅ Navigation works
- ✅ API calls to backend succeed

### 3. API Test

```bash
# Test API root
curl https://your-app.vercel.app/api

# Test authentication endpoint
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"password123"}'
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs
vercel logs <deployment-url>

# Common fixes:
npm run typecheck  # Check TypeScript errors
npm run build:vercel  # Test build locally
```

#### 2. Database Connection Issues

- ✅ Verify `DATABASE_URL` is correctly set
- ✅ Check database provider is online
- ✅ Ensure connection string format is correct
- ✅ Test connection locally

#### 3. CORS Errors

- ✅ Set `CORS_ORIGIN` to your Vercel app URL
- ✅ Ensure no trailing slashes in URL
- ✅ Redeploy after environment variable changes

#### 4. API Timeouts

- ✅ Check Vercel function logs
- ✅ Verify database connection pooling
- ✅ Review rate limiting settings

### Debugging Tools

```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Monitor function performance
vercel logs --follow
```

## 📈 Performance Optimization

### Client Optimization

- **Code splitting** configured in Vite
- **Asset optimization** for production builds
- **Manual chunking** for optimal loading

### Server Optimization

- **Database connection pooling**
- **Efficient Prisma client usage**
- **Proper serverless function configuration**

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect your repository to Vercel
2. Configure automatic deployments
3. Set environment variables in Vercel dashboard
4. Push to main branch triggers deployment

### Preview Deployments

- **Every PR** gets a preview deployment
- **Test changes** before merging
- **Share previews** with stakeholders

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/deployment/serverless)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables)

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review Vercel deployment logs
3. Verify environment variables
4. Test locally first

---

**Happy Deploying! 🚀**