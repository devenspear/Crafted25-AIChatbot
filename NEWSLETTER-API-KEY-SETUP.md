# Fix: Add Anthropic API Key for Newsletter Processor

## Problem

The newsletter processor is failing with:
```
API error: 500 - {"error":"API key not configured"}
```

## Solution

Your `.env.local` file is missing the `ANTHROPIC_API_KEY`.

### Step 1: Get Your API Key

If you don't have an Anthropic API key:
1. Go to: https://console.anthropic.com/
2. Sign in or create account
3. Go to "API Keys" section
4. Create a new key
5. Copy it (starts with `sk-ant-api03-...`)

### Step 2: Add to .env.local

Add this line to `/Users/dspear/ClaudeProjects/Crafted25-AIChatbot/.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

Replace `sk-ant-api03-YOUR_KEY_HERE` with your actual API key.

### Step 3: Restart Dev Server

```bash
# Kill existing server
pkill -f "next dev"

# Restart
cd /Users/dspear/ClaudeProjects/Crafted25-AIChatbot
npm run dev
```

### Step 4: Test

1. Go to http://localhost:3000/newsletter
2. Paste a URL or use Chrome extension to copy content
3. Click "Paste Manually" if URL extraction failed
4. Should now process successfully!

## Verification

After restarting, you should see in terminal:
```
[Newsletter API] Processing in newsletter mode - BYPASSING ANALYTICS
[Newsletter API] Claude response received
```

Instead of 500 errors.

## Cost Estimate

Newsletter processing with Claude 3.5 Sonnet:
- **~$0.015-0.03 per article**
- **~$0.30-0.60 for 15-20 articles weekly**

Very affordable for weekly newsletter curation!

## Security Note

⚠️ **Never commit .env.local to git**

The file is already in `.gitignore`, but double-check:
```bash
git status  # Should NOT show .env.local
```

## Still Having Issues?

Check that your API key:
- Starts with `sk-ant-api03-`
- Has no extra spaces or quotes
- Is on its own line in .env.local
- The file is in the project root directory

Share any error messages and I'll help debug!
