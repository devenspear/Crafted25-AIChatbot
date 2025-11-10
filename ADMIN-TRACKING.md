# Admin Dashboard & Usage Tracking

> **Implementation**: Lightweight tracking with Vercel KV (Redis)
> **Status**: Ready to deploy
> **Cost**: $0 (free tier covers your usage)
> **Last Updated**: November 10, 2025

---

## 📋 Overview

This document outlines the admin dashboard and usage tracking system for the CRAFTED AI chatbot. The system tracks real-time metrics, monitors usage patterns, and provides insights into user behavior.

### What Gets Tracked

**Core Metrics:**
- ✅ Total messages sent
- ✅ Messages per day
- ✅ Messages per hour
- ✅ Active sessions
- ✅ Average response time
- ✅ API token usage (for cost tracking)
- ✅ Error counts and types
- ✅ Popular queries

**Performance Metrics:**
- ✅ Response times (min/max/avg)
- ✅ RAG search effectiveness
- ✅ Cache hit rates

---

## 🏗️ Architecture

```
User Chat Request
    ↓
API Route (/api/chat)
    ↓
Track Request → Vercel KV
    ↓
Process with Claude
    ↓
Track Response → Vercel KV
    ↓
Return to User

Admin Dashboard (/admin)
    ↓
Fetch Stats from Vercel KV
    ↓
Display Metrics & Charts
```

---

## 📊 Data Schema (Vercel KV)

### Counters (Simple Keys)
```typescript
'stats:messages:total'        // Total all-time messages
'stats:sessions:total'        // Total unique sessions
'stats:errors:total'          // Total errors
'stats:messages:YYYY-MM-DD'   // Messages per day
'stats:messages:YYYY-MM-DD:HH' // Messages per hour
```

### Lists (Recent Data)
```typescript
'recent:queries'              // Last 100 user queries (JSON)
'recent:errors'               // Last 50 errors with details
'recent:sessions'             // Last 100 session IDs
```

### Hashes (Complex Data)
```typescript
'stats:response_times'        // { min, max, avg, count }
'stats:tokens'                // { input, output, total, cost }
'stats:daily:YYYY-MM-DD'      // Detailed daily stats
```

---

## 🔐 Authentication

**Method**: Simple password-based authentication via environment variable

**Environment Variable:**
```
ADMIN_PASSWORD=your-secure-password-here
```

**Access:**
- Visit: `https://craftedai.deven.network/admin`
- Enter password when prompted
- Session stored in browser (expires after 24 hours)

**Security Features:**
- No password storage (compared against env var)
- Rate limiting (max 5 attempts per minute)
- Session timeout after 24 hours
- HTTPS only (enforced by Vercel)

---

## 🎨 Admin Dashboard Features

### Dashboard View (`/admin`)

**Top Stats Cards:**
- Today's Messages
- Active Sessions (last hour)
- Average Response Time
- Estimated Daily Cost

**Charts & Graphs:**
- Messages per hour (last 24 hours)
- Messages per day (last 7 days)
- Response time trends
- Popular time slots

**Recent Activity:**
- Last 10 queries
- Recent errors (if any)
- Session statistics

**Export Options:**
- Download stats as CSV
- Export date range
- Clear old data

---

## 💾 Vercel KV Setup

### Step 1: Add Vercel KV Integration

1. Go to: https://vercel.com/deven-projects/crafted-assistant
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"KV"** (Redis)
5. Name it: `crafted-assistant-analytics`
6. Click **"Create"**

### Step 2: Connect to Project

1. Select the KV database you just created
2. Click **"Connect Project"**
3. Select `crafted-assistant` project
4. Click **"Connect"**
5. Environment variables are automatically added:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Add Admin Password

1. Still in Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: Your secure password (e.g., `crafted2025admin!`)
   - **Environments**: Check all three (Production, Preview, Development)
4. Click **"Save"**

### Step 4: Deploy

The next push to `main` will automatically:
- Install `@vercel/kv` package
- Connect to KV database
- Enable tracking
- Enable admin dashboard

---

## 📦 Dependencies

**New Package:**
```json
"@vercel/kv": "^3.0.0"
```

**Already Installed:**
- `next` (for routing)
- `react` (for UI)
- `tailwindcss` (for styling)

---

## 🚀 Usage

### Accessing Admin Dashboard

**Production:**
```
https://craftedai.deven.network/admin
```

**Local Development:**
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables in .env.local
KV_URL=your-kv-url-here
KV_REST_API_URL=your-rest-url-here
KV_REST_API_TOKEN=your-token-here
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
ADMIN_PASSWORD=your-password-here

# 3. Run dev server
npm run dev

# 4. Visit
http://localhost:3000/admin
```

---

## 📈 Metrics Explained

### Message Count
- **Total Messages**: All-time count of messages sent to the chatbot
- **Today's Messages**: Count resets at midnight UTC
- **Messages/Hour**: Real-time breakdown of current activity

### Sessions
- **Active Sessions**: Unique users in the last 60 minutes
- **Total Sessions**: All-time unique session IDs
- **Session Duration**: Average time users spend chatting

### Response Time
- **Average**: Mean response time across all requests
- **Min/Max**: Fastest and slowest responses
- **Percentiles**: p50, p95, p99 for performance analysis

### Token Usage & Cost
- **Input Tokens**: Tokens in user messages + system prompt
- **Output Tokens**: Tokens in Claude's responses
- **Total Tokens**: Sum of input + output
- **Estimated Cost**: Based on Claude 3.5 Haiku pricing:
  - Input: $0.25 per 1M tokens
  - Output: $1.25 per 1M tokens

### Popular Queries
- **Top 10**: Most frequently asked questions
- **Search Terms**: Keywords extracted from queries
- **Categories**: Auto-categorized by topic

---

## 🔧 API Endpoints

### Admin API Routes

**GET `/api/admin/stats`**
- Returns all statistics
- Requires authentication
- Response:
```json
{
  "messages": {
    "total": 1247,
    "today": 342,
    "thisHour": 23
  },
  "sessions": {
    "total": 523,
    "active": 12
  },
  "responseTime": {
    "avg": 1234,
    "min": 456,
    "max": 3210
  },
  "tokens": {
    "input": 123456,
    "output": 234567,
    "cost": 0.24
  },
  "errors": {
    "total": 3,
    "recent": []
  }
}
```

**GET `/api/admin/queries?limit=10`**
- Returns recent queries
- Requires authentication
- Response:
```json
{
  "queries": [
    {
      "text": "What time is the Firkin Fête?",
      "timestamp": "2025-11-10T14:32:10Z",
      "responseTime": 1234
    }
  ]
}
```

**POST `/api/admin/export`**
- Exports data as CSV
- Requires authentication
- Parameters: `startDate`, `endDate`

**DELETE `/api/admin/clear`**
- Clears old data
- Requires authentication
- Parameters: `olderThan` (days)

---

## 📊 Cost Analysis

### Vercel KV Pricing

**Free Tier:**
- 256 MB storage
- 10,000 commands/day
- More than enough for this use case

**Estimate for CRAFTED 2025:**
- ~1,000 messages/day = ~3,000 KV commands/day
- Well within free tier
- **Cost: $0/month**

**If you exceed free tier:**
- Pro tier: $20/month
- Includes 512 MB storage
- 100,000 commands/day

### Total System Cost

**Current (with tracking):**
- Vercel hosting: $0 (Hobby tier)
- Vercel KV: $0 (Free tier)
- Anthropic API: ~$6/month (with RAG)
- **Total: ~$6/month**

**Compared to without RAG:**
- Would be ~$90/month
- **Savings: $84/month with tracking added!**

---

## 🛠️ Maintenance

### Data Retention

**Automatic Cleanup:**
- Detailed logs: 30 days
- Hourly stats: 7 days
- Daily stats: 90 days
- Totals: Forever

**Manual Cleanup:**
Use admin dashboard to clear old data if needed.

### Monitoring

**Health Checks:**
- KV connection status
- API response times
- Error rates
- Storage usage

**Alerts (optional):**
- Set up Vercel monitoring
- Email alerts for high error rates
- Slack notifications for issues

---

## 🐛 Troubleshooting

### Admin Dashboard Not Loading

**Check:**
1. Environment variables set correctly in Vercel
2. `ADMIN_PASSWORD` is set
3. Vercel KV database is connected
4. Check browser console for errors

**Fix:**
```bash
# Verify environment variables
npx vercel env ls

# Verify KV connection
npx vercel storage ls
```

### Stats Not Updating

**Check:**
1. KV commands are incrementing
2. No errors in Vercel function logs
3. Time zone is correct (UTC)

**Fix:**
- Check Vercel function logs at `/api/chat`
- Verify KV connection in Vercel dashboard

### Authentication Issues

**Check:**
1. `ADMIN_PASSWORD` matches exactly (case-sensitive)
2. Browser cookies enabled
3. Not using incognito/private mode

**Fix:**
- Clear browser cookies
- Try different browser
- Reset `ADMIN_PASSWORD` in Vercel

---

## 🔒 Security Best Practices

1. **Strong Password**: Use 20+ character password with special chars
2. **Change Regularly**: Update `ADMIN_PASSWORD` every 90 days
3. **Monitor Access**: Check admin logs for unusual activity
4. **HTTPS Only**: Never access admin over HTTP
5. **Limit Sharing**: Only share password with trusted users
6. **Environment Vars**: Never commit passwords to git

---

## 📞 Support

### Getting Help

**Documentation:**
- This file: `ADMIN-TRACKING.md`
- Setup guide: `ADMIN-SETUP.md`
- Vercel KV docs: https://vercel.com/docs/storage/vercel-kv

**Common Issues:**
- See Troubleshooting section above
- Check Vercel function logs
- Review error messages in admin dashboard

---

## 🎯 Future Enhancements

**Phase 2 (Optional):**
- [ ] Add Vercel Postgres for detailed chat logs
- [ ] Export conversations for analysis
- [ ] A/B testing different prompts
- [ ] User satisfaction ratings
- [ ] Custom reports and dashboards
- [ ] Slack/email notifications
- [ ] Real-time websocket updates

**Phase 3 (Advanced):**
- [ ] Machine learning insights
- [ ] Automatic prompt optimization
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] Custom analytics widgets

---

## 📝 Change Log

### Version 1.0 (November 10, 2025)
- Initial implementation
- Vercel KV integration
- Basic metrics tracking
- Admin dashboard
- Password authentication
- Export functionality

---

**Ready to Deploy**: All code is ready. Just need to set up Vercel KV and add `ADMIN_PASSWORD` environment variable.

**Deployment Time**: ~5 minutes
**Implementation Time**: Completed
**Cost**: $0/month

---

*Documentation maintained by Claude Code - Last updated: November 10, 2025*
