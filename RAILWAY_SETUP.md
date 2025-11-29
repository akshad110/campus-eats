# 🚂 Railway MySQL Setup Guide (Free Tier)

Railway is the **easiest** way to get free MySQL hosting for your CampusEats project.

## ✅ Why Railway?

- ✅ **Free $5 credit monthly** (enough for small projects)
- ✅ **One-click MySQL setup**
- ✅ **No credit card required** for free tier
- ✅ **Automatic connection details**
- ✅ **Works perfectly with Render**

---

## 📋 Step-by-Step Setup

### Step 1: Sign Up

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

### Step 2: Create MySQL Database

1. In Railway dashboard, click **"New Project"**
2. Click **"New"** → **"Database"** → **"Add MySQL"**
3. Railway automatically creates a MySQL database for you
4. Wait for it to deploy (takes ~30 seconds)

### Step 3: Get Connection Details

1. Click on your **MySQL service** in the project
2. Go to the **"Variables"** tab
3. You'll see these environment variables:
   - `MYSQLHOST` → This is your `DB_HOST`
   - `MYSQLUSER` → This is your `DB_USER`
   - `MYSQLPASSWORD` → This is your `DB_PASSWORD`
   - `MYSQLDATABASE` → This is your `DB_NAME`
   - `MYSQLPORT` → This is your `DB_PORT` (usually `3306`)

### Step 4: Copy Connection Details

Copy these values - you'll need them for Render backend environment variables:

```
DB_HOST = <value from MYSQLHOST>
DB_USER = <value from MYSQLUSER>
DB_PASSWORD = <value from MYSQLPASSWORD>
DB_NAME = <value from MYSQLDATABASE>
DB_PORT = <value from MYSQLPORT> (usually 3306)
DB_SSL = false
```

### Step 5: Use in Render

When deploying your backend on Render, add these as environment variables:

1. Go to Render → Your Backend Service → Environment
2. Add each variable:
   - `DB_HOST` = (from Railway MYSQLHOST)
   - `DB_USER` = (from Railway MYSQLUSER)
   - `DB_PASSWORD` = (from Railway MYSQLPASSWORD)
   - `DB_NAME` = (from Railway MYSQLDATABASE)
   - `DB_PORT` = (from Railway MYSQLPORT, usually 3306)
   - `DB_SSL` = false

---

## 💰 Free Tier Limits

- **$5 free credit per month**
- **Enough for:** Small to medium projects
- **MySQL:** Included in free tier
- **No credit card required**

**Note:** If you exceed $5/month, Railway will pause your services (you can upgrade if needed).

---

## 🔍 Troubleshooting

### Can't find Variables tab?

1. Make sure you clicked on the **MySQL service** (not the project)
2. Look for "Variables" or "Environment" tab
3. If you don't see it, try refreshing the page

### Connection fails from Render?

1. Verify all environment variables are set correctly in Render
2. Check that `DB_SSL=false` is set
3. Verify the database is running (green status in Railway)
4. Check Railway logs for any errors

### Database not accessible?

- Railway databases are accessible from anywhere by default
- No need to whitelist IPs
- Just use the connection details from Variables tab

---

## 🎯 Quick Checklist

- [ ] Signed up at Railway
- [ ] Created MySQL database
- [ ] Copied connection details from Variables tab
- [ ] Added environment variables to Render backend
- [ ] Set `DB_SSL=false` in Render
- [ ] Tested connection

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

**That's it! Railway makes MySQL setup super easy. 🚂**

