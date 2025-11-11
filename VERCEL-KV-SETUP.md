# Vercel KV Setup Guide - 100% Complete Configuration

## Status: Code Ready ✅ | Database Creation Required ⏳

All code has been updated to use Vercel KV. Now we need to create the KV database and link it to the project.

---

## Option 1: Automatic Setup via Vercel Dashboard (EASIEST - 2 minutes)

### Step 1: Open Vercel Dashboard
Visit: https://vercel.com/deven-projects/crafted-assistant/stores

### Step 2: Create KV Database
1. Click **"Create Database"** button
2. Select **"KV"** (Key-Value Storage)
3. Database Name: `crafted-analytics` (or any name you prefer)
4. Region: **Washington, D.C., USA (iad1)** (closest to your project)
5. Click **"Create"**

### Step 3: Connect to Project (Automatic)
1. After creation, you'll see: "Connect to Project"
2. Select: **crafted-assistant**
3. Environment: **Production, Preview, Development** (select all three)
4. Click **"Connect"**

### Step 4: Done! ✅
Vercel automatically adds these environment variables to your project:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

The next deployment will automatically use persistent storage!

---

## Option 2: Manual Environment Variable Setup (If you already have a KV database)

If you already created a KV database elsewhere:

```bash
# Get your KV credentials from: https://vercel.com/deven-projects/stores

# Add to production
vercel env add KV_REST_API_URL production
vercel env add KV_REST_API_TOKEN production
vercel env add KV_URL production

# Add to preview
vercel env add KV_REST_API_URL preview
vercel env add KV_REST_API_TOKEN preview
vercel env add KV_URL preview

# Pull to local development
vercel env pull .env.local
```

---

## Option 3: CLI-Assisted Setup (Using Vercel CLI)

```bash
# Open Vercel dashboard in browser
open "https://vercel.com/deven-projects/crafted-assistant/stores"

# After creating KV database in dashboard, pull environment variables
vercel env pull .env.local

# Redeploy to activate KV storage
vercel --prod
```

---

## Verify KV is Working

### After Setup, Check Environment Variables:

```bash
vercel env ls
```

You should see:
```
KV_REST_API_URL       Encrypted    Production, Preview, Development
KV_REST_API_TOKEN     Encrypted    Production, Preview, Development
KV_URL                Encrypted    Production, Preview, Development
```

### Test Analytics Dashboard:

1. Visit: https://craftedai.deven.network
2. Send a few test messages
3. Visit: https://craftedai.deven.network/admin
4. Login with password: `ADMINp@ss2025`
5. You should see live data!
6. **Deploy again** - Data should PERSIST (this is the test!)

---

## What Changed (Technical Details)

### Files Updated:
1. ✅ `lib/analytics-kv.ts` - New KV-based analytics system
2. ✅ `app/api/chat/route.ts` - Uses KV analytics
3. ✅ `app/api/admin/analytics/route.ts` - Reads from KV
4. ✅ `package.json` - Added @vercel/kv dependency

### Storage Architecture:

**Before (In-Memory):**
```
JavaScript Variables → Lost on deploy/restart
```

**After (Vercel KV - Redis):**
```
Vercel KV (Redis) → Persistent → Survives deploys
```

### Data Structure in KV:

```javascript
// Events (Sorted Set by Timestamp)
analytics:events = [
  { timestamp: 123456, sessionId: "...", eventType: "chat_request", ... },
  { timestamp: 123457, sessionId: "...", eventType: "chat_response", ... },
  ...
]

// Sessions (Individual Keys with TTL)
analytics:sessions:session_123 = {
  sessionId: "session_123",
  messageCount: 5,
  totalTokens: 1200,
  categories: ["dining", "schedule"],
  ...
}

// Auto-cleanup: 30 days TTL
```

---

## Pricing & Limits (Vercel KV Free Tier)

| Feature | Free Tier | Your Usage (Estimated) |
|---------|-----------|------------------------|
| Storage | 256 MB | ~5 MB (plenty of room) |
| Requests | 3,000/day | ~500/day (well within) |
| Bandwidth | 100 MB/day | ~10 MB/day (no problem) |
| Cost | **$0/month** | **$0/month** ✅ |

**Conclusion:** Your analytics will stay 100% FREE on Vercel KV.

---

## Troubleshooting

### Issue: "Cannot connect to KV"
**Solution:** Make sure you completed Step 3 (Connect to Project) in the dashboard.

### Issue: "Environment variables not found"
**Solution:**
```bash
vercel env pull .env.local
npm run dev
```

### Issue: "Data still disappearing after deploy"
**Solution:** Check that KV environment variables are set:
```bash
vercel env ls | grep KV
```

### Issue: "Admin dashboard shows 0 sessions"
**Solution:**
1. Send a few test messages at https://craftedai.deven.network
2. Wait 5 seconds
3. Refresh the admin dashboard
4. Data should appear

---

## Next Steps After KV Setup

1. ✅ Create KV database (follow Option 1 above)
2. ✅ Deploy again: `git push origin main` (triggers auto-deploy)
3. ✅ Test analytics: Send messages and check admin dashboard
4. ✅ Verify persistence: Deploy again and confirm data survives

---

## Quick Commands Reference

```bash
# Check deployment status
vercel ls

# View environment variables
vercel env ls

# Pull env vars to local
vercel env pull .env.local

# Redeploy to production
git push origin main  # OR: vercel --prod

# Check build logs
vercel logs
```

---

## Summary

**What's Done:**
- ✅ Installed @vercel/kv SDK
- ✅ Updated all analytics code to use KV
- ✅ Code pushed to GitHub
- ✅ Build verified successfully

**What's Needed (2-minute task):**
- ⏳ Create KV database in Vercel dashboard
- ⏳ Connect KV to project (automatic)
- ⏳ Deploy again (automatic via GitHub push)

**Result:**
- 🎯 100% persistent analytics
- 🎯 Data survives all deployments
- 🎯 Track historical trends (weeks/months)
- 🎯 Zero cost (free tier)

---

**Ready to complete?** Follow Option 1 above - takes 2 minutes!
