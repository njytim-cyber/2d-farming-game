---
description: Deploy to production (Netlify)
---

# /deploy Workflow

## When to Use
- Shipping new features
- Publishing bug fixes
- Releasing new version

## Prerequisites
- All tests passing
- Game works in production build
- Netlify account connected (optional for auto-deploy)

## Steps

1. **Run Tests**
   // turbo
   ```bash
   npm test
   ```

2. **Build for Production**
   // turbo
   ```bash
   npm run build
   ```

3. **Preview Production Build**
   // turbo
   ```bash
   npm run preview
   ```
   - Test at http://localhost:4173
   - Verify everything works

4. **Deploy to Netlify**

   ### Option A: Git Push (if connected)
   ```bash
   git add .
   git commit -m "Deploy: description of changes"
   git push
   ```
   Netlify auto-deploys from main branch.

   ### Option B: Manual Deploy
   - Go to https://app.netlify.com
   - Drag `dist/` folder to deploy

## Netlify Config
The `netlify.toml` is already configured:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects enabled

## Post-Deploy Checklist
- [ ] Site loads without errors
- [ ] New game can be started
- [ ] Existing saves still work
- [ ] All features functional
