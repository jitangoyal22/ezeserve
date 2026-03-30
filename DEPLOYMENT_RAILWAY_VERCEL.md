# 🚀 ezeserve Deployment Guide - Railway + Vercel

## Complete Step-by-Step Instructions

---

## ✅ Prerequisites

1. **GitHub Account** (Free) - https://github.com
2. **Railway Account** (Free) - https://railway.app
3. **Vercel Account** (Free) - https://vercel.com
4. **Your Domain** - ezeserve.com (already have)

---

## 📦 STEP 1: Push Code to GitHub (5 minutes)

### 1.1 Download Your Code from Emergent

1. Go to Emergent dashboard
2. Click on your project "QR Restaurant Ordering"
3. Click **"Download Code"** button
4. Save the ZIP file and extract it

### 1.2 Create GitHub Repository

1. Go to https://github.com and login
2. Click **"New"** button (top right)
3. Name: `ezeserve`
4. Keep it **Public** (or Private if you prefer)
5. Click **"Create repository"**

### 1.3 Upload Code to GitHub

**Option A: Using GitHub Website (Easiest)**
1. In your new repository, click **"uploading an existing file"**
2. Drag the entire `app` folder contents
3. Click **"Commit changes"**

**Option B: Using Git Commands (If you know Git)**
```bash
cd /path/to/your/extracted/folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ezeserve.git
git push -u origin main
```

---

## 🚂 STEP 2: Deploy Backend to Railway (5 minutes)

### 2.1 Sign Up for Railway

1. Go to https://railway.app
2. Click **"Login"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"ezeserve"** repository
4. Click on the project that gets created

### 2.3 Add MongoDB Database

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add MongoDB"**
4. Wait for it to provision (1 minute)

### 2.4 Configure Backend Service

1. Click on your **backend service** (the one Railway auto-detected)
2. Go to **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Set: `backend`
5. Click **"Save"**

### 2.5 Add Environment Variables

1. Go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these variables:

**Required Variables:**

```
MONGO_URL = (Copy from MongoDB service - Click MongoDB → Connect → Copy the connection string)
DB_NAME = ezeserve_production
CORS_ORIGINS = https://ezeserve.com,https://www.ezeserve.com
EMERGENT_LLM_KEY = sk-emergent-bCdE7937550AbAc840
JWT_SECRET = your-super-secret-jwt-key-change-this-12345
```

**How to get MONGO_URL:**
1. Click on your **MongoDB** service
2. Go to **"Connect"** tab
3. Copy the **"Connection URL"**
4. Paste it as MONGO_URL value

### 2.6 Get Your Backend URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Copy the generated URL (e.g., `your-app.up.railway.app`)
5. **Save this URL** - you'll need it for frontend!

---

## ⚡ STEP 3: Deploy Frontend to Vercel (3 minutes)

### 3.1 Sign Up for Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select **"ezeserve"** repository
3. Click **"Import"**

### 3.3 Configure Project

1. **Framework Preset**: Create React App (should auto-detect)
2. **Root Directory**: Click "Edit" and set to `frontend`
3. **Build Command**: `yarn build` (should be auto-filled)
4. **Output Directory**: `build` (should be auto-filled)

### 3.4 Add Environment Variable

Click **"Environment Variables"**

Add this variable:
```
REACT_APP_BACKEND_URL = https://your-backend.up.railway.app
```
(Replace with the Railway URL you saved earlier)

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Once done, click **"Visit"** to see your app!

---

## 🌐 STEP 4: Connect Your Domain (ezeserve.com)

### 4.1 Connect Domain to Vercel (Frontend)

1. In Vercel project, go to **"Settings"**
2. Click **"Domains"**
3. Type: `ezeserve.com`
4. Click **"Add"**
5. Also add: `www.ezeserve.com`

### 4.2 Update DNS in Hostinger

1. Login to **Hostinger Dashboard**
2. Go to **"Domains"** → **"ezeserve.com"**
3. Click **"DNS / Name Servers"**

**Add these DNS records:**

**For main domain (ezeserve.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)
- TTL: 3600

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: 3600

### 4.3 Verify Domain

1. Go back to Vercel
2. Wait 5-10 minutes for DNS propagation
3. Vercel will automatically verify and enable SSL

---

## 🎉 STEP 5: Test Your Deployment

### 5.1 Test URLs

1. **Landing Page**: https://ezeserve.com
2. **Admin Login**: https://ezeserve.com/admin/login
3. **Backend API**: https://your-backend.up.railway.app/api

### 5.2 Create Test Account

1. Go to https://ezeserve.com/admin/login
2. Click "Don't have an account? Sign up"
3. Create admin account
4. Login and explore!

### 5.3 Update Backend CORS (Important!)

Go back to Railway:
1. Click your backend service
2. Go to **"Variables"**
3. Update `CORS_ORIGINS`:
```
CORS_ORIGINS = https://ezeserve.com,https://www.ezeserve.com,https://your-vercel-url.vercel.app
```
4. Service will auto-redeploy

---

## 💰 Cost Breakdown

### Free Tier Limits:
- **Railway**: $5 credit/month (enough for 5-10 restaurants)
- **Vercel**: FREE unlimited (frontend is static)
- **GitHub**: FREE forever

### After Free Tier:
- **Railway**: ~₹7/GB RAM/month
- **Typical cost**: ₹400-800/month for 20-50 restaurants
- **Break-even**: Just 1-2 paying restaurants!

---

## 🔧 Common Issues & Solutions

### Issue 1: "Application Error" on Railway
**Solution:** Check logs in Railway dashboard → Click service → "Deployments" → View logs

### Issue 2: Frontend can't connect to backend
**Solution:** 
1. Check `REACT_APP_BACKEND_URL` in Vercel settings
2. Ensure Railway backend has `/api` routes
3. Check CORS_ORIGINS in Railway includes your Vercel domain

### Issue 3: MongoDB connection error
**Solution:** 
1. Check MONGO_URL is correct
2. Make sure MongoDB service is running in Railway
3. Verify DB_NAME is set

### Issue 4: Images not uploading
**Solution:** 
1. Verify EMERGENT_LLM_KEY is set in Railway
2. Check backend logs for storage errors

---

## 🚀 Next Steps After Deployment

1. ✅ Test all features (orders, menu, tables)
2. ✅ Add your first restaurant
3. ✅ Upload menu items with images
4. ✅ Download QR codes
5. ✅ Share with first customer!

---

## 📊 Monitoring Your App

### Railway Dashboard:
- View logs: Click service → "Deployments" → View logs
- Check usage: "Metrics" tab
- Monitor costs: "Usage" section

### Vercel Dashboard:
- Analytics: See page views and performance
- Logs: Debug frontend issues
- Domains: Manage SSL certificates

---

## 🆘 Need Help?

**Check Logs:**
- **Backend**: Railway Dashboard → Your Service → Deployments → Logs
- **Frontend**: Vercel Dashboard → Your Project → Deployment → Function Logs

**Still Stuck?**
Let me know the error message and I'll help debug!

---

## 🎊 Congratulations!

Your ezeserve app is now live at **https://ezeserve.com**!

**You now have:**
- ✅ Professional restaurant ordering system
- ✅ Petpooja competitor at 1/10th the cost
- ✅ Scalable infrastructure
- ✅ Automatic deployments
- ✅ SSL certificate (https)
- ✅ Global CDN
- ✅ Free hosting (initially)

**Start onboarding restaurants and earning! 💰**
