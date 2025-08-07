# Deploying MealLensAI to Netlify

## Prerequisites
- GitHub repository with your code
- Netlify account (free)

## Step 1: Prepare Your Repository

Make sure your repository has these files:
- `netlify.toml` - Netlify configuration
- `package.json` - With build script
- `scripts/build.js` - Custom build script
- `public/landing.html` - Landing page
- `public/assets/` - Landing page assets

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. **Go to Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com)
   - Sign in or create account

2. **Connect Your Repository**
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, etc.)
   - Select your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (or your preferred version)

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

If your app uses environment variables, add them in Netlify:

1. Go to Site Settings > Environment Variables
2. Add your variables:
   - `VITE_API_URL` (if needed)
   - Any other environment variables

## Step 4: Custom Domain (Optional)

1. Go to Site Settings > Domain management
2. Add your custom domain
3. Configure DNS settings

## Step 5: Verify Deployment

Your app should be accessible at:
- **Landing Page**: `https://your-site.netlify.app/`
- **React App**: `https://your-site.netlify.app/app`
- **Login**: `https://your-site.netlify.app/login`
- **Signup**: `https://your-site.netlify.app/signup`

## Troubleshooting

### Build Issues
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Routing Issues
- Check `netlify.toml` configuration
- Ensure redirects are properly configured
- Test routes manually

### Asset Issues
- Verify `public/assets/` folder exists
- Check file paths in landing page
- Ensure build script copies assets correctly

## File Structure After Build

```
dist/
├── index.html          # React app entry
├── landing.html        # Landing page
├── assets/             # Landing page assets
│   ├── images/
│   ├── css/
│   └── js/
└── [other build files]
```

## Continuous Deployment

Netlify automatically deploys when you push to your main branch. To disable:
1. Go to Site Settings > Build & deploy
2. Disable automatic deployments

## Performance Tips

1. **Enable Asset Optimization**
   - Go to Site Settings > Build & deploy > Asset optimization
   - Enable minification and compression

2. **Enable CDN**
   - Netlify automatically serves assets via CDN

3. **Monitor Performance**
   - Use Netlify Analytics (paid feature)
   - Monitor Core Web Vitals

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html) 