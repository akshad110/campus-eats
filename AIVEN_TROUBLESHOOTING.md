# 🔧 Aiven MySQL Connection Troubleshooting

## Error: `ENOTFOUND` - DNS Lookup Failed

This error means the hostname cannot be resolved. Here's how to fix it:

---

## ✅ Step 1: Verify Aiven Service is Running

1. Go to your Aiven dashboard: https://console.aiven.io
2. Check your MySQL service status
3. Ensure it shows **"Running"** (green status)
4. If it's not running, wait for it to fully provision (can take 2-5 minutes)

---

## ✅ Step 2: Get Correct Connection Details

1. In Aiven dashboard, click on your **MySQL service**
2. Go to **"Overview"** tab
3. Click **"Connection information"** or **"Service URI"**
4. You'll see connection details like:

```
Host: mysql-xxxxx-xxxxx-xxxxx.aivencloud.com
Port: 12345 (Aiven uses custom ports, NOT 3306)
User: avnadmin
Password: [your password]
Database: defaultdb (or your database name)
```

---

## ✅ Step 3: Update Environment Variables in Render

Go to Render → Your Backend Service → Environment Variables:

**Important:** Aiven uses **custom ports** (not 3306). Make sure to use the port from Aiven!

```
DB_HOST = mysql-xxxxx-xxxxx-xxxxx.aivencloud.com
DB_PORT = 12345 (use the port from Aiven, NOT 3306!)
DB_USER = avnadmin (usually)
DB_PASSWORD = [your Aiven password]
DB_NAME = defaultdb (or your database name)
DB_SSL = true (Aiven requires SSL)
```

**⚠️ Common Mistake:** Using port 3306 instead of Aiven's custom port!

---

## ✅ Step 4: Verify Database Name

Aiven creates a default database. Check:
- Go to Aiven service → "Databases" tab
- Note the database name (usually `defaultdb`)
- Use this exact name in `DB_NAME`

---

## ✅ Step 5: Check Service Accessibility

Aiven services are accessible from anywhere by default, but verify:
1. Go to Aiven service → "Settings"
2. Check "Public access" is enabled
3. If you see IP whitelisting, ensure it's not blocking Render's IPs

---

## ✅ Step 6: Test Connection

After updating environment variables:
1. **Redeploy** your backend service in Render
2. Check the logs for connection details
3. Look for: `✅ Database connection established`

---

## 🔍 Common Issues

### Issue 1: Wrong Port
**Error:** `ENOTFOUND` or `ECONNREFUSED`
**Fix:** Use the port from Aiven connection info (usually 4-5 digits, NOT 3306)

### Issue 2: Wrong Hostname
**Error:** `ENOTFOUND`
**Fix:** Copy the exact hostname from Aiven (includes `.aivencloud.com`)

### Issue 3: SSL Not Enabled
**Error:** Connection fails silently
**Fix:** Set `DB_SSL=true` in environment variables

### Issue 4: Database Doesn't Exist
**Error:** `ER_BAD_DB_ERROR`
**Fix:** Use the database name from Aiven (usually `defaultdb`)

### Issue 5: Service Not Fully Provisioned
**Error:** `ENOTFOUND`
**Fix:** Wait 2-5 minutes for Aiven service to fully start

---

## 📋 Quick Checklist

- [ ] Aiven service is running (green status)
- [ ] Copied exact hostname from Aiven
- [ ] Using Aiven's custom port (NOT 3306)
- [ ] Using correct database name (usually `defaultdb`)
- [ ] Set `DB_SSL=true` in Render
- [ ] Redeployed backend after updating env vars
- [ ] Checked Render logs for connection status

---

## 🆘 Still Not Working?

1. **Double-check connection details:**
   - Aiven → Service → Connection information
   - Copy each value exactly

2. **Check Render logs:**
   - Render → Your Service → Logs
   - Look for connection errors
   - Check what hostname/port it's trying to use

3. **Try Railway instead:**
   - Railway is easier to set up
   - See `RAILWAY_SETUP.md` for instructions

---

## 💡 Alternative: Use Railway

If Aiven continues to give issues, Railway is much easier:
- One-click MySQL setup
- Automatic connection details
- No custom ports to worry about
- See `RAILWAY_SETUP.md`

---

**Need more help?** Check Aiven documentation: https://docs.aiven.io

