# 🚀 Deployment Guide for CampusEats on Render

This guide will help you deploy your full-stack CampusEats application to Render.

## 📋 Prerequisites

1. GitHub account
2. Render account (sign up at https://render.com)
3. Your code pushed to a GitHub repository

## 🗄️ Step 1: Deploy MySQL Database

**Note:** Render doesn't support MySQL directly. You have two options:

### Option A: Use PostgreSQL (Recommended)
Render supports PostgreSQL. You'll need to migrate your database schema.

### Option B: Use External MySQL Service
Use services like:
- **PlanetScale** (MySQL-compatible, serverless)
- **Aiven** (MySQL hosting)
- **Railway** (MySQL hosting)

For this guide, we'll use **PlanetScale** as it's free and MySQL-compatible.

### Setting up PlanetScale MySQL:

1. Go to https://planetscale.com and sign up
2. Create a new database called `campuseats`
3. Copy your connection string
4. You'll use this in Step 2

## 🔧 Step 2: Deploy Backend API

1. **Go to Render Dashboard** → New → Web Service
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name:** `campuseats-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Root Directory:** Leave empty (or `./` if needed)

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=your-planetscale-host
   DB_USER=your-planetscale-user
   DB_PASSWORD=your-planetscale-password
   DB_NAME=campuseats
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

5. **Click "Create Web Service"**

6. **Wait for deployment** - Note the URL (e.g., `https://campuseats-backend.onrender.com`)

## 🌐 Step 3: Deploy Frontend

1. **Go to Render Dashboard** → New → Static Site
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name:** `campuseats-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Add Environment Variables:**
   ```
   VITE_API_BASE_URL=https://campuseats-backend.onrender.com/api
   VITE_SOCKET_URL=https://campuseats-backend.onrender.com
   ```
   (Replace with your actual backend URL from Step 2)

5. **Click "Create Static Site"**

6. **Wait for deployment** - Note the URL (e.g., `https://campuseats-frontend.onrender.com`)

## 🔄 Step 4: Update Environment Variables

After both services are deployed:

1. **Update Backend FRONTEND_URL:**
   - Go to backend service settings
   - Update `FRONTEND_URL` to your frontend URL
   - Redeploy

2. **Verify Frontend Environment Variables:**
   - Make sure `VITE_API_BASE_URL` and `VITE_SOCKET_URL` point to your backend

## 🔍 Step 5: Verify Deployment

1. **Check Backend Health:**
   - Visit: `https://your-backend-url.onrender.com/`
   - Should see: `{"success":true,"message":"CampusEats API is running"}`

2. **Check Frontend:**
   - Visit your frontend URL
   - Try logging in/registering
   - Check browser console for errors

## 🐛 Troubleshooting

### Backend Issues:

**Error: Database connection failed**
- Verify DB credentials in environment variables
- Check if database is accessible from Render's IPs
- For PlanetScale, ensure you've created a branch and password

**Error: Port already in use**
- Render automatically assigns PORT, make sure you're using `process.env.PORT`

**CORS Errors:**
- Ensure `FRONTEND_URL` in backend matches your frontend URL exactly
- Check CORS configuration in `server/index.js`

### Frontend Issues:

**Error: Failed to fetch / API errors**
- Verify `VITE_API_BASE_URL` is set correctly
- Check that backend is running and accessible
- Check browser console for specific error messages

**Socket connection errors:**
- Verify `VITE_SOCKET_URL` is set correctly
- Ensure WebSocket is enabled on Render (should work by default)

### Database Issues:

**Tables not created:**
- Check backend logs for database initialization errors
- Verify database credentials are correct
- Ensure database exists and user has CREATE permissions

## 📝 Important Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading for production use

2. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Render's environment variable settings
   - Update variables when needed and redeploy

3. **Database:**
   - PlanetScale free tier: 1 database, 1GB storage
   - Consider backups for production
   - Monitor usage in PlanetScale dashboard

4. **SSL/HTTPS:**
   - Render provides SSL certificates automatically
   - All URLs should use `https://`

## 🔐 Security Checklist

- [ ] Remove hardcoded passwords from code
- [ ] Use environment variables for all secrets
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS for all connections
- [ ] Regularly update dependencies
- [ ] Monitor logs for errors

## 📚 Additional Resources

- Render Docs: https://render.com/docs
- PlanetScale Docs: https://planetscale.com/docs
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html

## 🎯 Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MySQL/PostgreSQL database set up
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Render
- [ ] Environment variables configured
- [ ] Database tables created (automatic on first run)
- [ ] Test login/registration
- [ ] Test order flow
- [ ] Verify WebSocket connections

---

**Need Help?** Check the troubleshooting section or review Render's logs in the dashboard.

