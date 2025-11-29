# ✅ Deployment Checklist for CampusEats

## 🔍 Pre-Deployment Code Review

### ✅ Fixed Issues:

1. **Hardcoded URLs Removed:**
   - ✅ All `http://localhost:3001` replaced with environment variables
   - ✅ Created `src/lib/config.ts` for centralized API configuration
   - ✅ Updated all API calls to use `VITE_API_BASE_URL`
   - ✅ Updated all Socket.io connections to use `VITE_SOCKET_URL`

2. **Environment Variables:**
   - ✅ Backend uses: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `FRONTEND_URL`
   - ✅ Frontend uses: `VITE_API_BASE_URL`, `VITE_SOCKET_URL`
   - ✅ Created `.env.example` file

3. **Database Configuration:**
   - ✅ Added SSL support for cloud MySQL (PlanetScale)
   - ✅ Added port configuration
   - ✅ Removed hardcoded password

4. **CORS Configuration:**
   - ✅ Updated to use `FRONTEND_URL` environment variable
   - ✅ Added credentials support

5. **Server Configuration:**
   - ✅ Updated to listen on `0.0.0.0` (required for Render)
   - ✅ Uses `process.env.PORT` (Render auto-assigns)

6. **Build Configuration:**
   - ✅ Updated `vite.config.ts` to handle missing SSL certs
   - ✅ Added build optimizations
   - ✅ Updated `package.json` with proper scripts

7. **Removed Dependencies:**
   - ✅ Removed Stripe import (not used)

---

## 📋 Deployment Steps

### Step 1: Prepare GitHub Repository
- [ ] Push all changes to GitHub
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify `node_modules` is in `.gitignore`
- [ ] Verify `dist` is in `.gitignore`

### Step 2: Set Up Database (Choose One)

**Option A: Railway (Recommended - Easiest)**
- [ ] Create Railway account (https://railway.app)
- [ ] Create new project
- [ ] Add MySQL database (one-click)
- [ ] Get connection details from "Variables" tab:
  - [ ] DB_HOST (from MYSQLHOST)
  - [ ] DB_USER (from MYSQLUSER)
  - [ ] DB_PASSWORD (from MYSQLPASSWORD)
  - [ ] DB_NAME (from MYSQLDATABASE)
  - [ ] DB_PORT (from MYSQLPORT, usually 3306)
- [ ] Set DB_SSL=false

**Option B: Aiven (Free Tier)**
- [ ] Create Aiven account (https://aiven.io)
- [ ] Create MySQL service (Free/Hobbyist plan)
- [ ] Get connection details from service overview
- [ ] Set DB_SSL=true

**Option C: Other Free MySQL Services**
- [ ] Sign up for free MySQL hosting
- [ ] Get connection details
- [ ] Configure DB_SSL as needed

### Step 3: Deploy Backend
- [ ] Go to Render → New Web Service
- [ ] Connect GitHub repository
- [ ] Configure:
  - [ ] Name: `campuseats-backend`
  - [ ] Environment: Node
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm run server`
- [ ] Add Environment Variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `DB_HOST=<from-planetscale>`
  - [ ] `DB_USER=<from-planetscale>`
  - [ ] `DB_PASSWORD=<from-planetscale>`
  - [ ] `DB_NAME=campuseats`
  - [ ] `DB_PORT=3306` (or your provider's port)
  - [ ] `DB_SSL=false` (true for Aiven, false for Railway)
  - [ ] `FRONTEND_URL=<will-update-after-frontend-deploy>`
- [ ] Deploy and note backend URL

### Step 4: Deploy Frontend
- [ ] Go to Render → New Static Site
- [ ] Connect GitHub repository
- [ ] Configure:
  - [ ] Name: `campuseats-frontend`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`
- [ ] Add Environment Variables:
  - [ ] `VITE_API_BASE_URL=https://your-backend-url.onrender.com/api`
  - [ ] `VITE_SOCKET_URL=https://your-backend-url.onrender.com`
- [ ] Deploy and note frontend URL

### Step 5: Update Environment Variables
- [ ] Update Backend `FRONTEND_URL` to frontend URL
- [ ] Redeploy backend (auto-redeploys on env var change)
- [ ] Verify frontend env vars are correct

### Step 6: Test Deployment
- [ ] Test backend health: `https://your-backend.onrender.com/`
- [ ] Test frontend loads correctly
- [ ] Test user registration
- [ ] Test user login
- [ ] Test shop creation (shopkeeper)
- [ ] Test order placement (student)
- [ ] Test payment flow
- [ ] Test WebSocket connections
- [ ] Check browser console for errors
- [ ] Check Render logs for errors

---

## 🐛 Common Issues to Watch For

### Database Connection
- **Issue:** `ER_ACCESS_DENIED_ERROR`
- **Fix:** Verify all DB credentials, check PlanetScale allows connections

### CORS Errors
- **Issue:** `Access to fetch blocked by CORS`
- **Fix:** Update `FRONTEND_URL` in backend to match frontend URL exactly

### API Not Found
- **Issue:** `Failed to fetch` or 404 errors
- **Fix:** Verify `VITE_API_BASE_URL` includes `/api` at the end

### WebSocket Issues
- **Issue:** Socket.io connection fails
- **Fix:** Verify `VITE_SOCKET_URL` matches backend URL (without `/api`)

### Build Failures
- **Issue:** Frontend build fails
- **Fix:** Check build logs, ensure all dependencies are in `package.json`

---

## 📝 Files Changed for Deployment

### New Files:
- `src/lib/config.ts` - API configuration
- `.env.example` - Environment variable template
- `DEPLOYMENT.md` - General deployment guide
- `RENDER_DEPLOYMENT.md` - Detailed Render deployment guide
- `DEPLOYMENT_CHECKLIST.md` - This file
- `render.yaml` - Render configuration (optional)

### Modified Files:
- `src/lib/api.ts` - Uses environment variables
- `src/contexts/AuthContext.tsx` - Uses environment variables
- `src/pages/Profile.tsx` - Uses environment variables
- `src/pages/Settings.tsx` - Uses environment variables
- `src/components/QRPaymentScanner.tsx` - Uses environment variables
- `src/components/ActiveOrders.tsx` - Uses environment variables
- `src/pages/AdminDashboard.tsx` - Uses environment variables
- `src/pages/AdminOrders.tsx` - Uses environment variables
- `src/pages/UserDashboard.tsx` - Uses environment variables
- `src/pages/UserOrders.tsx` - Uses environment variables
- `src/pages/ShopDetail.tsx` - Uses environment variables
- `src/components/OrderApproval.tsx` - Uses environment variables
- `server/index.js` - SSL support, CORS config, environment variables
- `vite.config.ts` - Build optimizations, optional SSL
- `package.json` - Added start script

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend responds to health check
- [ ] Database tables are created automatically
- [ ] User registration works
- [ ] User login works
- [ ] Shop creation works (shopkeeper)
- [ ] Menu item creation works
- [ ] Order placement works
- [ ] Payment screenshot upload works
- [ ] Order status updates work
- [ ] WebSocket connections work
- [ ] Notifications work
- [ ] Profile updates work
- [ ] Settings (password change) works
- [ ] No console errors in browser
- [ ] No errors in Render logs

---

## 🎯 Quick Start Commands

### Local Development:
```bash
# Backend only
npm run dev:server

# Frontend only
npm run dev

# Both
npm run dev:full
```

### Production Build:
```bash
# Build frontend
npm run build

# Start backend
npm run server
```

---

## 📞 Support

If you encounter issues:
1. Check Render logs (Dashboard → Service → Logs)
2. Check PlanetScale dashboard (Database status)
3. Check browser console (F12)
4. Review `RENDER_DEPLOYMENT.md` for detailed troubleshooting
5. Verify all environment variables are set correctly

---

**Ready to Deploy! 🚀**

