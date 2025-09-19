# 🚂 Railway Deployment Guide for TESTILLUSIO

This guide will help you deploy your TESTILLUSIO application to Railway for production hosting.

## 📋 Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository: [https://github.com/IllusioAI/TESTILLUSIO](https://github.com/IllusioAI/TESTILLUSIO)
- Required API keys (see Environment Variables section)

## 🚀 Quick Deployment Steps

### 1. Connect to Railway

1. **Go to Railway Dashboard**: Visit [railway.app](https://railway.app) and sign in
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose `IllusioAI/TESTILLUSIO`
5. **Deploy**: Railway will automatically detect the Next.js configuration

### 2. Configure Environment Variables

In your Railway project dashboard:

1. **Go to Variables Tab**
2. **Add Required Variables**:

```bash
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.railway.app
NODE_ENV=production

# AI API Keys (Required)
XAI_API_KEY=your_xai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Solana Blockchain APIs (Required)
HELIUS_API_KEY=your_helius_api_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Market Data APIs (Optional)
BIRDEYE_API_KEY=your_birdeye_api_key_here
JUPITER_API_KEY=your_jupiter_api_key_here

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app-name.railway.app
```

### 3. Add PostgreSQL Database (Optional)

If you need a database:

1. **Add Service**: Click "New" → "Database" → "PostgreSQL"
2. **Connect**: Railway will automatically set `DATABASE_URL` environment variable
3. **Use in App**: Your app can now connect to the PostgreSQL database

## 🔧 Configuration Files

The following files have been created for Railway deployment:

### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

## 🌐 Custom Domain (Optional)

1. **Go to Settings**: In your Railway project
2. **Add Domain**: Click "Domains" → "Custom Domain"
3. **Configure DNS**: Point your domain to Railway's provided URL
4. **SSL Certificate**: Railway automatically provides SSL certificates

## 📊 Monitoring & Logs

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic health monitoring at `/` endpoint
- **Restart Policy**: Automatic restarts on failure (max 10 retries)

## 🔄 Continuous Deployment

Railway automatically deploys when you push to your main branch:

1. **Push Changes**: `git push origin main`
2. **Auto Deploy**: Railway detects changes and starts new deployment
3. **Zero Downtime**: New version deploys without service interruption

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**:
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Review build logs in Railway dashboard

**Environment Variables**:
- Ensure all required API keys are set
- Check variable names match exactly (case-sensitive)
- Verify API keys are valid and have proper permissions

**Video Files**:
- Large video files (like Space_Time_Travel.mp4) are handled by Git LFS
- Ensure Git LFS is properly configured in your repository
- Railway will automatically download LFS files during build

### Performance Optimization

**Build Optimization**:
- Railway uses Nixpacks for optimal builds
- Automatic dependency caching
- Parallel build processes

**Runtime Optimization**:
- Next.js production build optimizations
- Automatic compression and minification
- CDN integration for static assets

## 💰 Pricing

Railway offers:
- **Free Tier**: $5 credit monthly
- **Pro Plan**: Pay-as-you-go pricing
- **Team Plans**: Collaborative features

Check [railway.app/pricing](https://railway.app/pricing) for current pricing.

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Git LFS Documentation](https://git-lfs.github.io)

## 📞 Support

- **Railway Support**: [railway.app/support](https://railway.app/support)
- **GitHub Issues**: [github.com/IllusioAI/TESTILLUSIO/issues](https://github.com/IllusioAI/TESTILLUSIO/issues)

---

**Your TESTILLUSIO app is now ready for production deployment on Railway! 🚀**
