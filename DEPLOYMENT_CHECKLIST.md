# 🚀 ASTRAL_NOTES Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. Database Setup
- [ ] Create PostgreSQL database (recommended: [Neon](https://neon.tech/))
- [ ] Get connection string: `postgresql://username:password@host:port/database`
- [ ] Note down the direct URL (if different from pooled URL)

### ✅ 2. Environment Variables
Required variables for production:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-32-character-secret
CORS_ORIGIN=https://your-app.vercel.app
```

Optional variables:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### ✅ 3. Vercel CLI Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

## Deployment Process

### 🚀 Quick Deploy (Automated)

**Option 1: Linux/Mac**
```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

**Option 2: Windows**
```cmd
scripts\deploy-vercel.bat
```

### 🛠️ Manual Deploy

```bash
# 1. Install and build
npm run setup
npm run typecheck
npm run build:vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN

# 4. Redeploy with environment
vercel --prod
```

## Post-Deployment

### ✅ 1. Verify Deployment
- [ ] Check health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Test frontend loading: `https://your-app.vercel.app`
- [ ] Verify API routes work

### ✅ 2. Database Migration
```bash
# If using new database, run migrations
cd server
npx prisma migrate deploy
```

### ✅ 3. Test Key Features
- [ ] User registration/login
- [ ] Project creation
- [ ] Scene/story management
- [ ] Notes functionality

## Environment Variables Reference

### Required
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Token signing | `your-super-secure-32-char-secret` |
| `CORS_ORIGIN` | Frontend domain | `https://your-app.vercel.app` |

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `BCRYPT_ROUNDS` | `12` | Password hashing strength |

## Troubleshooting

### 🔧 Common Issues

**Build Failures**
```bash
# Check logs
vercel logs

# Test locally
npm run build:vercel
```

**Database Issues**
- Verify `DATABASE_URL` format
- Check database provider status
- Test connection string locally

**CORS Errors**
- Set `CORS_ORIGIN` to exact Vercel URL
- Remove trailing slashes
- Redeploy after variable changes

**API Timeouts**
- Check Vercel function logs
- Verify database connection pooling
- Review rate limiting settings

### 📊 Monitoring

```bash
# View real-time logs
vercel logs --follow

# Check deployment status
vercel ls

# View environment variables
vercel env ls
```

## File Structure Summary

```
📁 ASTRAL_NOTES/
├── 📄 vercel.json                 # Vercel configuration
├── 📄 package.json                # Root build scripts
├── 📄 .env.vercel.example         # Environment template
├── 📄 VERCEL_DEPLOYMENT.md        # Detailed guide
├── 📄 DEPLOYMENT_CHECKLIST.md     # This checklist
├── 📁 client/                     # Frontend (React/Vite)
├── 📁 server/                     # Backend (Express/Prisma)
│   ├── 📁 api/                   # Vercel serverless function
│   └── 📁 prisma/                # Database schema
└── 📁 scripts/                   # Deployment scripts
```

## Success Indicators

✅ **Deployment Successful When:**
- Health check returns `200 OK`
- Frontend loads without errors
- API endpoints respond correctly
- Database queries work
- Authentication functions properly

---

**Need Help?** Check the [detailed deployment guide](./VERCEL_DEPLOYMENT.md)