# 📦 Deployment Guide - Commercial Edition

Complete deployment guide for Murder Mystery Generator commercial deployment on Netlify.

## 🎯 Overview

This guide covers the complete deployment process from development to production, including security configuration, performance optimization, and monitoring setup.

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- [ ] **Netlify Account** - For hosting and deployment
- [ ] **Groq API Account** - For AI generation services
- [ ] **GitHub Account** - For source code management
- [ ] **Domain Name** (optional) - For custom domain setup

### Required Software
- [ ] **Node.js** (v16.0 or higher)
- [ ] **Git** (latest version)
- [ ] **Netlify CLI** (will be installed automatically)

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

**For Netlify Production:**
1. Go to Netlify Dashboard
2. Select your site
3. Go to Site Settings → Environment Variables
4. Add new variable:
   - **Key**: `GROQ_API_KEY`
   - **Value**: Your Groq API key

### 2. Security Configuration

#### Netlify Security Headers
The project includes pre-configured security headers in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.groq.com https://*.netlify.app https://*.netlify.com"
```

## 🚀 Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### GitHub Integration Setup
1. **Connect to GitHub**
   ```bash
   # Push your code to GitHub
   git remote add origin https://github.com/your-username/murder-mystery-generator.git
   git push -u origin main
   ```

2. **Deploy to Netlify**
   ```bash
   # Run automated deployment
   npm run production-deploy
   ```

#### What the automated script does:
- ✅ Validates environment configuration
- ✅ Runs security and code quality checks
- ✅ Optimizes files for production
- ✅ Commits and pushes changes to Git
- ✅ Deploys to Netlify production
- ✅ Verifies deployment success

### Method 2: Manual Deployment

#### Step 1: Validate Configuration
```bash
npm run validate
```

#### Step 2: Run Pre-build Checks
```bash
npm run prebuild
```

#### Step 3: Build for Production
```bash
npm run build
```

#### Step 4: Deploy to Netlify
```bash
netlify deploy --prod
```

### Method 3: Git-based Continuous Deployment

#### Initial Setup
1. **Connect Repository to Netlify**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect your GitHub repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `public`
     - **Function directory**: `api`

2. **Configure Environment Variables**
   - Add `GROQ_API_KEY` in Netlify dashboard
   - Set `NODE_ENV=production`

3. **Enable Auto-Deploy**
   - Automatic deployments on `main` branch push
   - Branch deploys for pull requests

## ⚙️ Build Configuration

### Netlify Configuration (`netlify.toml`)

```toml
[build]
  publish = "public"
  command = "npm run build"

[functions]
  directory = "api"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Security headers configured automatically
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "node scripts/production-build.js",
    "prebuild": "node scripts/pre-build-checks.js",
    "validate": "node scripts/validate-config.js",
    "deploy": "npm run build && netlify deploy --prod",
    "production-deploy": "npm run validate && npm run test && npm run build && netlify deploy --prod"
  }
}
```

## 🔍 Post-Deployment Verification

### Automated Checks

The deployment script automatically verifies:
- ✅ Site accessibility (HTTP 200 response)
- ✅ Security headers presence
- ✅ API endpoints functionality
- ✅ CSS and JavaScript loading

### Manual Verification

#### 1. Functional Testing
- [ ] Homepage loads correctly
- [ ] Form validation works
- [ ] Scenario generation completes
- [ ] PDF download functions
- [ ] Error handling displays correctly

#### 2. Performance Testing
```bash
# Check Core Web Vitals
npx lighthouse https://your-site.netlify.app --only-categories=performance

# Test mobile performance
npx lighthouse https://your-site.netlify.app --preset=desktop --only-categories=performance
```

#### 3. Security Testing
```bash
# Check security headers
curl -I https://your-site.netlify.app

# Verify CSP compliance
# Check browser console for CSP violations
```

#### 4. API Testing
```bash
# Test API endpoint
curl -X POST https://your-site.netlify.app/api/health \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🌐 Custom Domain Setup

### 1. Domain Configuration

#### Add Custom Domain in Netlify
1. Go to Netlify Dashboard → Domain Settings
2. Add custom domain
3. Configure DNS records:

```dns
# A Record
Type: A
Name: @
Value: 75.2.60.5

# CNAME Record  
Type: CNAME
Name: www
Value: your-site.netlify.app
```

### 2. SSL Certificate

Netlify automatically provisions SSL certificates via Let's Encrypt:
- ✅ Automatic HTTPS redirect
- ✅ Certificate auto-renewal
- ✅ HTTP/2 support

## 📊 Monitoring & Analytics

### Built-in Monitoring

The application includes:
- **Performance metrics** - Core Web Vitals tracking
- **Error logging** - Structured error reporting
- **Usage analytics** - User interaction tracking
- **API monitoring** - Response time and error rates

### External Monitoring Setup

#### 1. Netlify Analytics
- Enable in Netlify Dashboard
- Provides traffic and performance insights

#### 2. Uptime Monitoring
```bash
# Example: UptimeRobot configuration
Monitor URL: https://your-site.netlify.app/api/health
Check Interval: 5 minutes
```

#### 3. Performance Monitoring
- Google PageSpeed Insights
- GTmetrix
- WebPageTest

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures

**Error: Missing environment variables**
```bash
# Solution: Set environment variables
netlify env:set GROQ_API_KEY your_key_here
```

**Error: Node version mismatch**
```bash
# Solution: Specify Node version in netlify.toml
[build.environment]
  NODE_VERSION = "18"
```

**Error: Build timeout**
```bash
# Solution: Optimize build process or increase timeout
[build]
  command = "npm run build"
  commandTimeout = 600
```

#### Runtime Issues

**API Functions not working**
- Check function directory configuration
- Verify environment variables are set
- Check function logs in Netlify dashboard

**404 Errors on page refresh**
- Ensure redirect rules are configured
- Check SPA fallback in netlify.toml

**Security header issues**
- Verify netlify.toml header configuration
- Check CSP directives for third-party resources

### Debugging Tools

#### Netlify CLI Debug
```bash
# Check site status
netlify status

# View deployment logs  
netlify logs

# Test functions locally
netlify dev
```

#### Log Analysis
```bash
# View function logs
netlify functions:log function-name

# Check build logs
netlify sites:list
netlify deploy --debug
```

## 📈 Performance Optimization

### Post-Deployment Optimizations

#### 1. Asset Optimization
- Minified CSS and JavaScript
- Optimized images (WebP format)
- Compressed assets (Gzip/Brotli)

#### 2. Caching Strategy
```toml
# Add to netlify.toml
[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

#### 3. CDN Configuration
- Automatic global CDN via Netlify
- Edge caching for static assets
- Geographic distribution

## 🔄 Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Check deployment logs for errors
- [ ] Monitor performance metrics
- [ ] Review security headers

#### Monthly  
- [ ] Update dependencies
- [ ] Review API usage and costs
- [ ] Check SSL certificate status
- [ ] Backup configuration

#### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Infrastructure optimization
- [ ] Documentation updates

### Getting Help

- **Netlify Support**: [Netlify Docs](https://docs.netlify.com)
- **Groq Support**: [Groq Documentation](https://console.groq.com/docs)
- **Technical Issues**: Create GitHub issue
- **Security Concerns**: Contact security team

---

**🎉 Your Murder Mystery Generator is now ready for commercial deployment!**

For additional support or custom deployment requirements, contact the development team.