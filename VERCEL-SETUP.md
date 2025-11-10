# Vercel Environment Variable Setup

## ⚠️ CRITICAL: API Key Configuration Required

If you see **"API Key not configured"** in the live UI, it means the `ANTHROPIC_API_KEY` environment variable is not set in Vercel.

---

## 🔑 How to Fix: Add Environment Variable in Vercel

### Step 1: Get Your Anthropic API Key

1. Go to: https://console.anthropic.com/settings/keys
2. Log in to your Anthropic account
3. Click **"Create Key"** (if you don't have one)
4. Copy the key (starts with `sk-ant-api03-...`)

### Step 2: Add to Vercel

**Option A: Via Vercel Dashboard** (Recommended)

1. Go to: https://vercel.com/deven-projects/crafted-assistant
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in left sidebar
4. Click **"Add New"**
5. Fill in:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key (e.g., `sk-ant-api03-...`)
   - **Environments**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Click **"Save"**

**Option B: Via Vercel CLI**

```bash
# Navigate to project directory
cd /home/user/Crafted25-AIChatbot

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted

# Add to preview environments
vercel env add ANTHROPIC_API_KEY preview
# Paste your API key when prompted

# Add to development
vercel env add ANTHROPIC_API_KEY development
# Paste your API key when prompted
```

### Step 3: Redeploy

After adding the environment variable, you need to redeploy:

**Option A: Via Vercel Dashboard**

1. Go to: https://vercel.com/deven-projects/crafted-assistant
2. Click **"Deployments"** tab
3. Find the latest deployment
4. Click the **"..."** menu
5. Click **"Redeploy"**
6. Confirm redeploy

**Option B: Trigger with Empty Commit**

```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

**Option C: Via Vercel CLI**

```bash
vercel --prod
```

---

## ✅ Verify It's Working

After redeployment completes (~30-60 seconds):

1. Visit: https://craftedai.deven.network
2. Type a message like: "What is CRAFTED?"
3. You should get a response (not "API Key not configured")

---

## 🔍 Troubleshooting

### Still seeing "API Key not configured"?

1. **Check Environment Variable**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `ANTHROPIC_API_KEY` exists
   - Verify it's enabled for "Production"

2. **Check API Key is Valid**:
   - Go to https://console.anthropic.com/settings/keys
   - Verify your key is active (not revoked)
   - Try creating a new key if needed

3. **Force Fresh Deployment**:
   ```bash
   # Delete .vercel cache locally
   rm -rf .vercel

   # Redeploy
   vercel --prod --force
   ```

4. **Check Vercel Function Logs**:
   - Go to: https://vercel.com/deven-projects/crafted-assistant
   - Click "Deployments" → Latest deployment
   - Click "Functions" tab
   - Look for `/api/chat` errors

---

## 📝 Environment Variables Reference

### Required

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | https://console.anthropic.com/settings/keys |

### Auto-Provided by Vercel

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Used for version numbering in UI footer |

---

## 🔒 Security Notes

- ✅ **Never commit** `.env.local` or `.env` files to git
- ✅ **Never share** your API key publicly
- ✅ Environment variables are encrypted by Vercel
- ✅ Only accessible to your Vercel team
- ✅ Not exposed to client-side code

---

## 🚀 After Setup

Once the API key is configured and redeployed:

1. **Test the chatbot** thoroughly
2. **Monitor API usage** at https://console.anthropic.com
3. **Check costs** after a few days
4. **Expected usage** (with RAG): ~$6/month for 1000 messages/day

---

## 📞 Need Help?

If you're still stuck:

1. Check Vercel deployment logs
2. Check Anthropic API status: https://status.anthropic.com
3. Verify your Anthropic account has API access
4. Contact Vercel support if deployment issues persist

---

**Last Updated**: November 10, 2025
