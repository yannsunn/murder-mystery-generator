# 📦 Deployment Guide - Vercel Edition

Complete deployment guide for Murder Mystery Generator commercial deployment on Vercel.

## 🎯 Overview

This guide covers the complete deployment process from development to production, including security configuration, performance optimization, and monitoring setup for Vercel.

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- [ ] **Vercel Account** - For hosting and deployment
- [ ] **Groq API Account** - For AI generation services
- [ ] **GitHub Account** - For source code management
- [ ] **Domain Name** (optional) - For custom domain setup

### Required Software
- [ ] **Node.js** (v18.0 or higher)
- [ ] **Git** (latest version)
- [ ] **Vercel CLI** (will be installed automatically)

### Required Credentials
- [ ] **Groq API Key** - Obtained from Groq Console
- [ ] **GitHub Personal Access Token** (if using private repo)
- [ ] **Domain DNS Configuration** (if using custom domain)

## 🔐 Environment Setup

### 1. API Key Configuration

#### Obtain Groq API Key
1. Visit [Groq Console](https://console.groq.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

#### Set Environment Variables

**For Local Development:**
```bash
# Create .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
```

**For Vercel Production:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `gsk_your_actual_key_here`
   - **Environments**: Production, Preview, Development

## 🚀 Deployment Process

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test the application
npm test
```

### Production Deployment

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npm run deploy
```

#### Method 2: GitHub Integration
1. **Connect Repository to Vercel**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import from GitHub
   - Add `GROQ_API_KEY` in Vercel dashboard

### Vercel Configuration (`vercel.json`)

The project includes optimized Vercel configuration:

```json
{
  "version": 2,
  "functions": {
    "api/enhanced-pdf-generator.js": {
      "maxDuration": 90
    },
    "api/staged-generation.js": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## 🔒 Security Configuration

Vercel automatically handles:
- HTTPS enforcement
- Secure headers via `vercel.json`
- Environment variable encryption
- DDoS protection

## 📊 Performance Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard
- Real-time metrics
- Core Web Vitals monitoring

### Health Check
Monitor URL: https://your-site.vercel.app/api/health

## 🛠️ Troubleshooting

### Common Issues

#### 1. Environment Variables
```bash
# Check environment variables
vercel env ls
```

#### 2. Function Timeouts
- Increase `maxDuration` in `vercel.json`
- Use staged generation for complex operations

#### 3. Build Failures
```bash
# Local build test
npm run build
```

## 🌐 Custom Domain Setup

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. Vercel automatically provisions SSL

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Monitoring & Analytics

### Built-in Vercel Features
- Real-time function logs
- Performance metrics
- Error tracking
- Bandwidth monitoring

### Custom Monitoring
```bash
# Function logs
vercel logs
```

## 🆘 Support Resources

- **Vercel Support**: [Vercel Docs](https://vercel.com/docs)
- **Groq API**: [Groq Documentation](https://console.groq.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**🎯 Ready to deploy? Run `npm run deploy` after setting up your environment variables!**