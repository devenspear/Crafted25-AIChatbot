# Admin Dashboard Setup Guide

> **Quick Setup**: 5 minutes to deploy
> **Skill Level**: Beginner-friendly
> **Cost**: $0/month

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Add Vercel KV Database (2 minutes)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/deven-projects/crafted-assistant
   - Click **"Storage"** tab in the top navigation

2. **Create KV Database**
   - Click **"Create Database"** button
   - Select **"KV"** (Redis icon)
   - Database Name: `crafted-assistant-analytics`
   - Region: Select closest to your users (e.g., `us-east-1`)
   - Click **"Create"**

3. **Connect to Project**
   - Click **"Connect Project"** button
   - Select: `crafted-assistant`
   - Environment: Check **All** (Production, Preview, Development)
   - Click **"Connect"**

   ✅ This automatically adds these environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 2: Add Admin Password (1 minute)

1. **Still in Vercel Dashboard**
   - Go to **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

2. **Add New Variable**
   - Click **"Add New"** button
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: Your secure password (e.g., `Crafted2025Admin!SecurePass`)
   - **Environments**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

### Step 3: Update Dependencies (1 minute)

The code is ready, but we need to add the Vercel KV package.

**Option A: Update package.json manually**
Add this to the `dependencies` section in `package.json`:
```json
"@vercel/kv": "^3.0.0"
```

**Option B: I'll do it for you**
Just say "add the KV package" and I'll update it.

### Step 4: Deploy (1 minute)

Once the code is pushed to `main`:
1. Vercel auto-deploys (~30 seconds)
2. Wait for deployment to complete
3. Visit: https://craftedai.deven.network/admin
4. Enter your `ADMIN_PASSWORD`
5. ✅ See your dashboard!

---

## 🎯 What You'll See

### Admin Dashboard Features

**Top Stats (Real-time):**
```
┌─────────────────────────────────────┐
│  📊 Today's Messages: 342           │
│  👥 Active Sessions: 12             │
│  ⚡ Avg Response: 1.2s              │
│  💰 Est. Daily Cost: $0.20          │
└─────────────────────────────────────┘
```

**Charts:**
- Messages per hour (last 24 hours)
- Messages per day (last 7 days)
- Response time trends

**Recent Activity:**
- Last 10 user queries
- Recent errors (if any)
- Popular questions

**Actions:**
- 📥 Export data as CSV
- 🗑️ Clear old data
- 🔄 Refresh stats

---

## 🔐 Accessing the Admin Dashboard

### Production
```
URL: https://craftedai.deven.network/admin
Password: [Your ADMIN_PASSWORD]
```

### Local Development
```bash
# 1. Clone and install
git clone https://github.com/devenspear/Crafted25-AIChatbot.git
cd Crafted25-AIChatbot
npm install

# 2. Create .env.local file
touch .env.local

# 3. Add environment variables (get from Vercel dashboard)
# Go to: Settings → Environment Variables → Download all as .env.local
# Or manually add:
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-url
KV_REST_API_TOKEN=your-kv-token
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token
ADMIN_PASSWORD=your-admin-password
ANTHROPIC_API_KEY=your-anthropic-key

# 4. Run dev server
npm run dev

# 5. Visit
http://localhost:3000/admin
```

---

## 📊 Understanding the Metrics

### Messages
- **Total**: All-time message count
- **Today**: Resets at midnight UTC
- **This Hour**: Current hour activity

### Sessions
- **Total**: Unique visitors all-time
- **Active**: Users in last 60 minutes

### Response Time
- **Average**: Mean time for API responses
- **Min/Max**: Best and worst response times

### Cost Estimate
Based on token usage and Claude 3.5 Haiku pricing:
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens

**Example:**
```
1,000 messages/day
~20 tokens per message (with RAG)
= 20,000 tokens/day
= 600,000 tokens/month
≈ $0.15 input + $0.75 output
≈ $6/month total
```

---

## 🛠️ Troubleshooting

### "KV_URL is not defined"

**Problem**: Vercel KV not connected properly

**Fix:**
1. Go to Vercel Dashboard → Storage
2. Check that KV database exists
3. Click on the database
4. Verify it's connected to `crafted-assistant` project
5. If not, click "Connect Project" and select it
6. Redeploy the application

### "Invalid password"

**Problem**: Password doesn't match `ADMIN_PASSWORD` env var

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Check `ADMIN_PASSWORD` value
3. Ensure no extra spaces or characters
4. Password is case-sensitive
5. Clear browser cookies and try again

### Dashboard shows zero stats

**Problem**: No data has been tracked yet

**Fix:**
1. Send a few test messages to the chatbot
2. Refresh the admin dashboard
3. If still zero, check Vercel function logs:
   - Dashboard → Deployments → Latest → Functions tab
   - Look for errors in `/api/chat` logs

### "Failed to fetch stats"

**Problem**: API error or authentication issue

**Fix:**
1. Check browser console (F12)
2. Verify you're logged in
3. Check Vercel function logs for errors
4. Ensure all environment variables are set
5. Try redeploying

---

## 🔒 Security Tips

### Creating a Strong Password

**Good Examples:**
```
Crafted2025!Admin#Secure
AlysBeach$Analytics@2025
CRAFTED_admin_2025!
```

**Bad Examples:**
```
password
admin123
crafted
```

**Best Practices:**
- 20+ characters
- Mix of upper/lowercase
- Include numbers
- Include special characters (!@#$%^&*)
- Don't use common words
- Don't share publicly

### Changing Your Password

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Find `ADMIN_PASSWORD`
4. Click "Edit"
5. Enter new password
6. Save
7. Redeploy (or wait for next deployment)

### Revoking Access

If you need to immediately revoke access:
1. Change `ADMIN_PASSWORD` in Vercel
2. Redeploy immediately:
   ```bash
   git commit --allow-empty -m "Revoke admin access"
   git push origin main
   ```
3. Wait ~30 seconds for deployment
4. Old password no longer works

---

## 📈 Monitoring Your Event

### Before CRAFTED (Nov 12)

**Setup Week:**
- Install admin dashboard
- Test with sample queries
- Familiarize yourself with metrics
- Set up export schedule

### During CRAFTED (Nov 12-16)

**Daily Checks:**
- Morning: Check overnight activity
- Midday: Monitor peak usage
- Evening: Review popular queries
- Export daily reports

**Watch For:**
- Spike in errors
- Slow response times
- Unusual query patterns
- High API costs

### After CRAFTED

**Analysis:**
- Export all data
- Review popular questions
- Identify improvement opportunities
- Calculate actual costs vs estimates

---

## 💾 Exporting Data

### Via Admin Dashboard

1. Go to: `/admin`
2. Scroll to "Export Data" section
3. Select date range
4. Click "Download CSV"
5. Open in Excel/Google Sheets

### CSV Format

```csv
Date,Messages,Sessions,Avg Response Time,Tokens,Cost
2025-11-12,1247,423,1.2s,24940,0.24
2025-11-13,1532,512,1.1s,30640,0.29
```

### Via API (Advanced)

```bash
curl -X POST https://craftedai.deven.network/api/admin/export \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-12", "endDate": "2025-11-16"}' \
  > crafted-2025-analytics.csv
```

---

## 🧹 Data Cleanup

### Automatic Cleanup

The system automatically removes:
- Detailed query logs > 30 days old
- Hourly stats > 7 days old
- Keep daily stats for 90 days
- Keep totals forever

### Manual Cleanup

1. Go to `/admin`
2. Scroll to "Data Management"
3. Select retention period (e.g., "Clear data older than 30 days")
4. Click "Clear Old Data"
5. Confirm

**Warning**: This cannot be undone. Export data first!

---

## 📞 Getting Help

### Quick Checks

Before asking for help:
- [ ] Verified Vercel KV is connected
- [ ] All environment variables are set
- [ ] Checked Vercel function logs
- [ ] Tried in different browser
- [ ] Cleared cookies/cache

### Where to Look

**Vercel Dashboard:**
- Storage → Check KV database status
- Deployments → Check latest deployment logs
- Functions → Check `/api/chat` logs
- Settings → Verify environment variables

**Local Testing:**
```bash
# Check environment
npm run dev

# Test admin route
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_PASSWORD"
```

### Documentation

- **Full Guide**: `ADMIN-TRACKING.md`
- **This Setup**: `ADMIN-SETUP.md`
- **Vercel Docs**: https://vercel.com/docs/storage/vercel-kv
- **Vercel KV SDK**: https://github.com/vercel/storage/tree/main/packages/kv

---

## 🎯 Next Steps

After setup is complete:

1. ✅ **Test the Dashboard**
   - Send a few test messages
   - Check stats update in real-time
   - Try exporting data

2. ✅ **Share Access (Optional)**
   - Share `ADMIN_PASSWORD` with team members
   - Document who has access
   - Set up password rotation schedule

3. ✅ **Monitor Before Event**
   - Check daily leading up to Nov 12
   - Ensure everything works smoothly
   - Set up any alerts/notifications

4. ✅ **Prepare for Event**
   - Plan daily check schedule
   - Set up export routine
   - Brief team on how to read dashboard

---

## ✨ You're All Set!

Once you complete Steps 1-4 above, your admin dashboard will be live and tracking all chatbot activity.

**Access:** https://craftedai.deven.network/admin

**Questions?** Check `ADMIN-TRACKING.md` for detailed technical documentation.

---

*Setup guide created by Claude Code - Last updated: November 10, 2025*
