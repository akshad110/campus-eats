# 📸 Cloudinary Image Upload Setup Guide

This guide will help you set up Cloudinary for image storage, which will save significant database space by storing image URLs instead of base64 strings.

## ✅ Why Cloudinary?

- **Free Tier:** 25GB storage, 25GB bandwidth/month
- **Automatic optimization:** Images are automatically optimized
- **CDN delivery:** Fast image loading worldwide
- **Saves database space:** URLs are ~100 bytes vs base64 which can be 100KB+

---

## 📋 Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com
2. Click **"Sign Up for Free"**
3. Sign up with email or GitHub
4. Verify your email if required

---

## 🔑 Step 2: Get API Credentials

1. After signing in, you'll see your **Dashboard**
2. Look for **"Account Details"** or go to **Settings** → **Security**
3. Copy these three values:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

**⚠️ Important:** Keep your API Secret secure! Never commit it to GitHub.

---

## 🔧 Step 3: Add Environment Variables

### For Local Development

Create or update `.env` file in the project root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### For Render (Production)

1. Go to Render Dashboard → Your Backend Service
2. Click **"Environment"** tab
3. Add these environment variables:
   - `CLOUDINARY_CLOUD_NAME` = (your cloud name)
   - `CLOUDINARY_API_KEY` = (your API key)
   - `CLOUDINARY_API_SECRET` = (your API secret)
4. Click **"Save Changes"** (this will trigger a redeploy)

---

## 📦 Step 4: Install Dependencies

The dependencies are already added to `server/package.json`. Just run:

```bash
npm install
```

Or if you're in the server directory:

```bash
cd server
npm install
```

This will install:
- `cloudinary` - Cloudinary SDK
- `multer` - File upload handling
- `streamifier` - Stream handling for uploads

---

## ✅ Step 5: Test the Setup

1. **Start your backend server:**
   ```bash
   npm run dev:server
   ```

2. **Check the logs** - you should see the server starting normally

3. **Test image upload:**
   - Use the frontend to upload a payment screenshot
   - Check the browser console for any errors
   - The image should upload to Cloudinary and return a URL

---

## 🔍 How It Works

### Before (Base64 Storage):
- Image → Convert to base64 → Store in database (LONGTEXT)
- **Size:** ~100KB per image
- **Database usage:** Grows quickly

### After (Cloudinary URLs):
- Image → Upload to Cloudinary → Get URL → Store URL in database
- **Size:** ~100 bytes per URL
- **Database usage:** Minimal

### Fallback Behavior:
- If Cloudinary is **not configured**, the system automatically falls back to base64
- This ensures your app works even without Cloudinary setup
- You'll see a warning in the response: `"Cloudinary not configured - using base64 fallback"`

---

## 📊 Storage Comparison

| Method | Image Size | Database Storage |
|--------|-----------|------------------|
| Base64 | 100KB | 100KB per image |
| Cloudinary URL | 100KB | ~100 bytes per URL |

**Example:** 1000 payment screenshots
- Base64: **100MB** in database
- Cloudinary: **100KB** in database (images stored in Cloudinary)

---

## 🎯 API Endpoints

### Upload Image (File)
```
POST /api/upload-image
Content-Type: multipart/form-data
Body: { image: File }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "public_id": "campuseats/xyz123"
  }
}
```

### Upload Image (Base64)
```
POST /api/upload-image-base64
Content-Type: application/json
Body: { "image": "data:image/jpeg;base64,..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "public_id": "campuseats/xyz123"
  }
}
```

---

## 🔒 Security Notes

1. **API Secret:** Never expose your API Secret in frontend code
2. **Upload limits:** Currently set to 10MB per image
3. **File types:** Only image files are accepted
4. **Folder organization:** All images are stored in `campuseats/` folder in Cloudinary

---

## 🆘 Troubleshooting

### Issue: "Cloudinary not configured"
**Solution:** Add the three environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)

### Issue: "Failed to upload image"
**Solution:** 
- Check your API credentials are correct
- Verify your Cloudinary account is active
- Check the file size (max 10MB)

### Issue: Images still stored as base64
**Solution:**
- Check backend logs for Cloudinary errors
- Verify environment variables are set correctly
- Restart the backend server after adding env vars

---

## 💡 Next Steps

1. ✅ Set up Cloudinary account
2. ✅ Add environment variables
3. ✅ Test image uploads
4. ✅ Monitor Cloudinary dashboard for usage
5. ✅ Consider upgrading if you exceed free tier limits

---

## 📚 Resources

- Cloudinary Documentation: https://cloudinary.com/documentation
- Free Tier Limits: https://cloudinary.com/pricing
- Dashboard: https://console.cloudinary.com

---

**Need help?** Check the backend logs or Cloudinary dashboard for detailed error messages.

