# 🚀 Complete Deployment Guide for CampusEats on Render

## Overview

This guide will help you deploy your CampusEats application to Render with:
- **MySQL Database** (using PlanetScale - free MySQL hosting)
- **Backend API** (Node.js/Express on Render)
- **Frontend** (React/Vite static site on Render)

---

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Render account (https://render.com - free tier available)
3. ✅ PlanetScale account (https://planetscale.com - free tier available)
4. ✅ Your code pushed to GitHub

---

## 🗄️ Step 1: Set Up MySQL Database (Free Options)

Since Render doesn't support MySQL directly, here are **FREE** alternatives:

### Option 1: Railway (Recommended - Easiest) ⭐

**Railway offers free MySQL hosting with $5 free credit monthly:**

1. **Sign up at Railway:**
   - Go to https://railway.app
   - Sign up with GitHub (free tier available)

2. **Create MySQL Database:**
   - Click "New Project"
   - Click "New" → "Database" → "Add MySQL"
   - Railway automatically creates the database
   - Click on the MySQL service to see connection details

3. **Get Connection Details:**
   - Go to MySQL service → "Variables" tab
   - You'll see:
     - `MYSQLHOST` → Use as `DB_HOST`
     - `MYSQLUSER` → Use as `DB_USER`
     - `MYSQLPASSWORD` → Use as `DB_PASSWORD`
     - `MYSQLDATABASE` → Use as `DB_NAME`
     - `MYSQLPORT` → Use as `DB_PORT` (usually `3306`)

4. **Note:** Railway provides $5 free credit monthly, which is enough for small projects.

---

### Option 2: Aiven (Free Tier Available)

1. **Sign up at Aiven:**
   - Go to https://aiven.io
   - Sign up (free tier available)

2. **Create MySQL Service:**
   - Click "Create service"
   - Service type: MySQL
   - Plan: Free (Hobbyist)
   - Cloud provider: Choose closest region
   - Click "Create service"

3. **Get Connection Details:**
   - Go to your service → "Overview"
   - Click "Connection information"
   - Copy the connection string or extract:
     - Host, Port, User, Password, Database name

---

### Option 3: Render PostgreSQL (Free Tier) - Requires Migration

If you want to use Render's built-in PostgreSQL (free tier):

1. **Go to Render Dashboard:**
   - Click "New +" → "PostgreSQL"
   - Name: `campuseats-db`
   - Plan: Free
   - Click "Create database"

2. **Note:** This requires changing your code from MySQL to PostgreSQL (different syntax).

---

### Option 4: Free MySQL Hosting Services

Other free MySQL options:
- **db4free.net** - Free MySQL hosting (limited)
- **FreeSQLDatabase.com** - Free MySQL (with limitations)
- **AlwaysData** - Free tier with MySQL

**⚠️ Warning:** Free MySQL services often have limitations (size, connections, uptime). For production, consider Railway or Aiven.

---

### Recommended: Railway (Easiest Setup)

For the easiest setup, I recommend **Railway** because:
- ✅ Free $5 credit monthly (enough for small projects)
- ✅ Easy setup (one-click MySQL)
- ✅ Automatic connection details
- ✅ No credit card required for free tier
- ✅ Works perfectly with Render

---

## 🔧 Step 2: Database Configuration

The code already supports SSL connections. For Railway and most cloud providers:

- **Railway:** Usually doesn't require SSL (but code handles it)
- **Aiven:** Requires SSL (auto-handled by code)
- **Other services:** Check their documentation

The current code in `server/index.js` automatically detects if SSL is needed based on the hostname or `DB_SSL` environment variable.

**For Railway:** You typically don't need to set `DB_SSL=true` (but you can if you get SSL errors).

**For Aiven:** Set `DB_SSL=true` in your environment variables.

---

## 🖥️ Step 3: Deploy Backend API

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository:**
   - Connect your GitHub account
   - Select your `campus-eats` repository
   - Click "Connect"

3. **Configure Backend Service:**
   ```
   Name: campuseats-backend
   Environment: Node
   Region: Choose closest to you
   Branch: main (or your default branch)
   Root Directory: . (leave empty)
   Build Command: npm install
   Start Command: npm run server
   ```

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   NODE_ENV = production
   PORT = 3001
   DB_HOST = your-mysql-host (from Railway/Aiven/etc)
   DB_USER = your-mysql-username
   DB_PASSWORD = your-mysql-password
   DB_NAME = campuseats (or your database name)
   DB_PORT = 3306 (or the port from your provider)
   DB_SSL = false (set to true for Aiven, false for Railway)
   FRONTEND_URL = https://your-frontend-url.onrender.com
   ```
   
   **Important:** Leave `FRONTEND_URL` empty for now, we'll update it after deploying frontend.

5. **Click "Create Web Service"**

6. **Wait for Deployment:**
   - First deployment takes 5-10 minutes
   - Watch the logs for any errors
   - Note your backend URL: `https://campuseats-backend.onrender.com`

---

## 🌐 Step 4: Deploy Frontend

1. **Go to Render Dashboard:**
   - Click "New +" → "Static Site"

2. **Connect Repository:**
   - Select the same GitHub repository
   - Click "Connect"

3. **Configure Frontend Service:**
   ```
   Name: campuseats-frontend
   Branch: main (or your default branch)
   Root Directory: . (leave empty)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
   
   **Important:** The `_redirects` file in the `public` folder will be automatically copied to `dist` during build. This file ensures that refreshing routes like `/home` works correctly by serving `index.html` for all routes.

4. **Add Environment Variables:**
   ```
   VITE_API_BASE_URL = https://campuseats-backend.onrender.com/api
   VITE_SOCKET_URL = https://campuseats-backend.onrender.com
   ```
   
   **Replace with your actual backend URL from Step 3**

5. **Click "Create Static Site"**

6. **Wait for Deployment:**
   - Note your frontend URL: `https://campuseats-frontend.onrender.com`

---

## 🔄 Step 5: Update Environment Variables

After both services are deployed:

1. **Update Backend:**
   - Go to backend service → "Environment"
   - Update `FRONTEND_URL` to: `https://campuseats-frontend.onrender.com`
   - Click "Save Changes" → Service will auto-redeploy

2. **Verify Frontend:**
   - Check that `VITE_API_BASE_URL` and `VITE_SOCKET_URL` are correct
   - If you need to update, go to frontend service → "Environment" → Update → Redeploy

---

## ✅ Step 6: Verify Deployment

1. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/`
   - Should see: `{"success":true,"message":"CampusEats API is running"}`

2. **Test Frontend:**
   - Visit your frontend URL
   - Try registering a new account
   - Try logging in
   - Check browser console (F12) for any errors

3. **Test Database:**
   - Try creating a shop (if shopkeeper)
   - Try placing an order (if student)
   - Check PlanetScale dashboard to see if tables were created

---

## 🐛 Common Issues & Solutions

### Issue 1: Database Connection Failed

**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solution:**
- Verify all DB credentials in environment variables
- For Railway: Check the "Variables" tab in your MySQL service
- For Aiven: Check connection info in service overview
- Ensure `DB_SSL` is set correctly (true for Aiven, false for Railway)
- Check if your database allows external connections
- Verify the database exists and user has proper permissions

### Issue 2: CORS Errors

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
- Update `FRONTEND_URL` in backend environment variables
- Ensure it matches your frontend URL exactly (including https://)
- Redeploy backend after updating

### Issue 3: Frontend Can't Connect to Backend

**Error:** `Failed to fetch` or `Network error`

**Solution:**
- Verify `VITE_API_BASE_URL` in frontend environment variables
- Check that backend is running (visit backend URL)
- Ensure URLs use `https://` not `http://`
- Check browser console for specific error

### Issue 4: WebSocket Connection Failed

**Error:** Socket.io connection errors

**Solution:**
- Verify `VITE_SOCKET_URL` in frontend environment variables
- Ensure it matches backend URL (without /api)
- Check that backend WebSocket is enabled (should work by default on Render)

### Issue 5: Tables Not Created

**Error:** Database queries fail

**Solution:**
- Check backend logs for database initialization errors
- Verify database user has CREATE permissions
- Check PlanetScale dashboard → "Schema" to see if tables exist
- Manually run SQL if needed (PlanetScale has SQL editor)

### Issue 6: Services Keep Restarting

**Solution:**
- Check logs for errors
- Verify all environment variables are set
- Check if database connection is successful
- Ensure PORT is set correctly (Render auto-assigns, but we use 3001)

### Issue 7: "Not Found" When Refreshing Routes (e.g., /home)

**Error:** Getting "Not Found" page when refreshing routes like `/home` or any client-side route

**Solution:**
1. **Check `_redirects` file exists:**
   - File should be at: `public/_redirects`
   - Content should be: `/*    /index.html   200`
   - This file is automatically copied to `dist/_redirects` during build

2. **If `_redirects` file doesn't work, manually configure in Render:**
   - Go to Render Dashboard → Your Frontend Service → Settings
   - Scroll down to "Redirects/Rewrites" section
   - Click "Add Redirect"
   - Configure:
     - **From:** `/*`
     - **To:** `/index.html`
     - **Status:** `200`
   - Click "Save" and redeploy

3. **Verify after redeploy:**
   - Visit your frontend URL
   - Navigate to `/home` (should work)
   - Refresh the page (should still work, not show "Not Found")

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong database passwords**
3. **Update `FRONTEND_URL` to your actual domain** (not `*`)
4. **Enable PlanetScale branch protection** for production
5. **Regularly update dependencies**
6. **Monitor logs for suspicious activity**

---

## 📊 Monitoring & Maintenance

### Check Logs:
- Backend: Render Dashboard → Your Service → "Logs"
- Frontend: Render Dashboard → Your Service → "Logs"
- Database: PlanetScale Dashboard → "Insights"

### Database Management:
- View tables: PlanetScale Dashboard → "Schema"
- Run queries: PlanetScale Dashboard → "Console"
- Monitor usage: PlanetScale Dashboard → "Usage"

### Service Health:
- Render automatically monitors services
- Services auto-restart on crashes
- Free tier: Services spin down after 15 min inactivity

---

## 🎯 Quick Reference

### Environment Variables Summary:

**Backend:**
```
NODE_ENV=production
PORT=3001
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-user
DB_PASSWORD=your-planetscale-password
DB_NAME=campuseats
DB_PORT=3306
FRONTEND_URL=https://your-frontend.onrender.com
```

**Frontend:**
```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### URLs After Deployment:
- Backend API: `https://campuseats-backend.onrender.com`
- Frontend: `https://campuseats-frontend.onrender.com`
- Database: Managed by PlanetScale

---

## 🚨 Important Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds (cold start)
   - Consider upgrading for production use

2. **Database:**
   - PlanetScale free tier: 1 database, 1GB storage, 1 billion rows/month
   - Branch-based workflow (main = production)
   - Automatic backups included

3. **SSL/HTTPS:**
   - Render provides free SSL certificates
   - All URLs must use `https://`
   - PlanetScale requires SSL connections

4. **Environment Variables:**
   - Changes require redeployment
   - Frontend env vars are baked into build
   - Backend env vars are runtime

---

## 📞 Need Help?

1. Check Render logs for errors
2. Check PlanetScale dashboard for database issues
3. Review browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure services are not in "sleep" mode (free tier)

---

**Happy Deploying! 🎉**

