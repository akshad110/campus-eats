# Fix "Not Found" Error on Refresh - Render Static Site

## Problem
When refreshing routes like `/home` on your Render-hosted site, you get a "Not Found" error. This happens because the server doesn't know about client-side routes.

## ⚠️ IMPORTANT: Don't Access `/index.html` Directly
- **DO:** Access routes like `/home`, `/profile`, etc.
- **DON'T:** Access `/index.html` directly (it will show 404)
- The redirect serves `index.html` automatically for all routes

## Solution: Configure Redirects in Render Dashboard

The `_redirects` file might not work automatically on Render. You **MUST** manually configure redirects:

### Step 1: Go to Render Dashboard
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click on your **Frontend Static Site** service (e.g., `campuseats-frontend`)

### Step 2: Configure Redirects
1. Click on **"Settings"** tab (left sidebar)
2. Scroll down to **"Redirects/Rewrites"** section
3. Click **"Add Redirect"** or **"Add Rewrite"** button
4. Configure the redirect:
   - **Source/From:** `/*` (matches all routes)
   - **Destination/To:** `/index.html`
   - **Action:** ⚠️ **MUST be "Rewrite" (NOT "Redirect")!**
     - If you see "Redirect" in the dropdown, change it to **"Rewrite"**
     - "Redirect" = 301/302 (changes URL, breaks SPA) ❌
     - "Rewrite" = 200 (keeps URL, works for SPA) ✅
5. Click **"Save Changes"**

### Step 3: Wait for Redeploy
1. After saving, Render will automatically redeploy
2. Wait for deployment to complete (check "Events" tab)
3. Status should show "Live"

### Step 4: Test
1. Visit: `https://your-site.onrender.com/home` (NOT `/index.html`)
2. The page should load correctly
3. Refresh the page (F5) - should still work, not show "Not Found"
4. Try other routes: `/profile`, `/settings`, etc.

## Why Status Code 200?
- **200** = Rewrite (server serves `index.html` but URL stays the same) ✅
- **301/302** = Redirect (browser changes URL, breaks SPA routing) ❌

## Troubleshooting

### Still Getting 404?
1. **Verify redirect is saved:**
   - Go to Settings → Redirects/Rewrites
   - Should see: `/*` → `/index.html` (200)

2. **Check deployment:**
   - Go to "Events" tab
   - Should show "Deploy succeeded"
   - If failed, check logs

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. **Verify you're testing correct URL:**
   - ✅ `https://your-site.onrender.com/home`
   - ❌ `https://your-site.onrender.com/index.html` (don't test this)

### Redirect Not Showing in Settings?
- Some Render plans might not have this feature
- Alternative: Contact Render support or upgrade plan
- Or: Serve frontend from backend (more complex)

## Quick Reference
- **Redirect From:** `/*`
- **Redirect To:** `/index.html`
- **Status:** `200`
- **Test URL:** `/home` (not `/index.html`)

