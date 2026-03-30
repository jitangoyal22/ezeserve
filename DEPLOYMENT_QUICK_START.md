# 🚀 Quick Deployment Checklist

## ✅ Before You Start
- [ ] GitHub account created
- [ ] Railway account created  
- [ ] Vercel account created
- [ ] Code downloaded from Emergent

## 📦 Step 1: GitHub (2 mins)
- [ ] Create repository "ezeserve"
- [ ] Upload code to GitHub

## 🚂 Step 2: Railway - Backend (5 mins)
- [ ] Login with GitHub
- [ ] New Project → Deploy from GitHub
- [ ] Add MongoDB database
- [ ] Set Root Directory: `backend`
- [ ] Add environment variables:
  - `MONGO_URL` (from MongoDB service)
  - `DB_NAME` = ezeserve_production
  - `CORS_ORIGINS` = https://ezeserve.com
  - `EMERGENT_LLM_KEY` = sk-emergent-bCdE7937550AbAc840
  - `JWT_SECRET` = your-secret-key
- [ ] Generate domain
- [ ] **Save backend URL**

## ⚡ Step 3: Vercel - Frontend (3 mins)
- [ ] Login with GitHub
- [ ] Import "ezeserve" repository
- [ ] Set Root Directory: `frontend`
- [ ] Add environment variable:
  - `REACT_APP_BACKEND_URL` = [Railway backend URL]
- [ ] Deploy
- [ ] **Save Vercel URL**

## 🌐 Step 4: Domain Setup (5 mins)
**In Vercel:**
- [ ] Settings → Domains
- [ ] Add ezeserve.com
- [ ] Add www.ezeserve.com

**In Hostinger DNS:**
- [ ] A record: @ → 76.76.21.21
- [ ] CNAME: www → cname.vercel-dns.com

## 🎉 Step 5: Test
- [ ] Visit https://ezeserve.com
- [ ] Create admin account
- [ ] Add restaurant
- [ ] Add menu items
- [ ] Test order flow

---

## 💰 Total Cost
- **Setup**: FREE
- **First month**: FREE
- **After**: ₹400-800/month

## ⏱️ Total Time
**15 minutes total!**

---

## 🆘 Quick Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your App**: https://ezeserve.com
- **Admin Panel**: https://ezeserve.com/admin/login

---

## 📝 Environment Variables Quick Copy

### Railway Backend:
```
MONGO_URL=[Get from MongoDB service]
DB_NAME=ezeserve_production
CORS_ORIGINS=https://ezeserve.com,https://www.ezeserve.com
EMERGENT_LLM_KEY=sk-emergent-bCdE7937550AbAc840
JWT_SECRET=change-this-to-random-secret-key-12345
```

### Vercel Frontend:
```
REACT_APP_BACKEND_URL=[Your Railway backend URL]
```

---

**Need detailed steps? Open `/app/DEPLOYMENT_RAILWAY_VERCEL.md`**
