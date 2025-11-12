# Disruption Weekly Batch Processor

## Overview

A powerful web-based tool designed to process 15-20 newsletter URLs weekly, automatically extracting content and formatting it according to **Disruption Weekly Scout** guidelines.

## Problem Solved

Many news sources (Business Insider, WSJ, Reuters, etc.) now block AI agents from accessing their content. This tool provides a hybrid approach:
- **Automatic extraction** when possible (using Jina AI Reader)
- **Manual paste fallback** for blocked URLs
- **Consistent formatting** via Claude AI using your specific newsletter rules

## Access the Tool

**URL:** http://localhost:3000/newsletter

Or when deployed: https://craftedai.deven.network/newsletter

## How It Works

### Step 1: Batch Input
1. Paste your 15-20 URLs into the text area
2. One URL per line
3. Click "Process URLs"

### Step 2: Automatic Extraction
The system will:
- Try to extract content automatically using Jina AI
- Show real-time status for each URL:
  - ✅ **Success**: Content extracted automatically
  - ❌ **Failed**: Requires manual paste (shows error reason)
  - 📝 **Manual Entry**: Already processed via manual paste

### Step 3: Manual Paste for Blocked URLs
For any failed URLs:
1. Click the **"Paste Manually"** button next to the failed URL
2. Open the article in your browser (you can read it as a human)
3. Copy the FULL article text (not just headlines or summary)
4. Paste into the modal
5. Click "Process Content"

**Important:** The content must be 400+ words for processing.

### Step 4: Review & Export
- View all formatted articles with:
  - Two headline options (≤ 12 words each)
  - Six bullet points (11-16 words each)
  - Original URL at the bottom
- Click **"Copy All to Clipboard"** to export everything

## Formatting Rules (Automated)

The system follows your **Disruption Weekly Scout** rules exactly:

### Source Purity
- 100% content from the provided source only
- No speculation, inference, or external research
- No hallucination - facts must be in the source text
- If insufficient content, article is rejected

### Writing Style
- **Audience**: SMB/mid-market leaders, innovation execs
- **Tone**: Forward-looking, strategic, data-rich
- **Focus**: Numbers, adoption metrics, regulatory clarity, market implications
- **Avoid**: Hype, consumer angles, speculative fluff

### Output Format
- **Two headline options**: ≤ 12 words each
- **Six bullets**: 11-16 words each, business/strategic focus
- **One URL**: At the end only

## Test Results

From your sample URLs:
- ✅ **TipRanks**: Auto-extracted successfully
- ❌ **Business Insider**: Blocked (requires manual paste)
- ❌ **Reuters**: Blocked (requires manual paste)
- ❌ **WSJ**: Subscription required (requires manual paste)

## Technical Details

### Architecture
- **Frontend**: Next.js 16 + React + Tailwind CSS
- **Extraction**: Jina AI Reader API (proxy via `/api/extract`)
- **Formatting**: Claude 3.5 Sonnet (via `/api/chat` newsletter mode)
- **Temperature**: 0.3 (consistent formatting)

### API Endpoints
- `POST /api/extract` - URL content extraction
- `POST /api/chat` - Claude AI formatting (newsletterMode: true)

### Files Created
- `/app/newsletter/page.tsx` - Main UI
- `/app/api/extract/route.ts` - Extraction proxy
- `/app/api/chat/route.ts` - Updated with newsletter mode

## Workflow Example

```
Input:
https://www.tipranks.com/news/apple-appl-could-grab-133b-a-year-bonanza-from-humanoid-robots-claims-morgan-stanley

Auto-Extract: ✅ Success (1,523 words extracted)

Output:
═══════════════════════════════════════════════════════
ARTICLE 1
═══════════════════════════════════════════════════════

Apple Could Capture $133B Robotics Revenue by 2040
Morgan Stanley Projects Major Apple Humanoid Robotics Opportunity

• Morgan Stanley estimates Apple could generate $130 billion annually from robotics by 2040.
• Analysis projects 415,000 annual U.S. household humanoid units adopted, 1.6 million cumulative total.
• Analysts estimate average selling price of approximately $30,000 per humanoid robot unit.
• Apple possesses $130 billion cash, 2.3 billion device base, and autonomous vehicle tech.
• Tesla's Optimus robot plans 5,000 units in 2025, scaling to 1 million annually.
• Morgan Stanley forecasts nearly 1 billion humanoid robots globally by 2050 potential market.

https://www.tipranks.com/news/apple-appl-could-grab-133b-a-year-bonanza-from-humanoid-robots-claims-morgan-stanley
```

## Tips for Success

1. **Full Text Required**: When manually pasting, copy the entire article, not just excerpts
2. **Check Word Count**: Must be 400+ words minimum
3. **Batch Processing**: Process all URLs at once for efficiency
4. **Review Before Export**: Check formatting before copying to clipboard
5. **Browser Session**: For paywalled sites, make sure you're logged in when copying content

## Cost & Performance

- **Automatic extraction**: Free (Jina AI)
- **Claude formatting**: ~$0.015-0.03 per article (Sonnet 3.5)
- **Processing time**: 3-5 seconds per article
- **Total weekly cost**: ~$0.30-0.60 for 15-20 articles

## Future Enhancements

Possible additions:
- Save processed newsletters to database
- Email export functionality
- Custom formatting templates
- Bulk edit before export
- Browser extension for one-click extraction

## Support

For issues or questions, check:
- Server logs: `npm run dev` terminal output
- Browser console: F12 → Console tab
- API errors: Check Network tab in browser dev tools

## Deployment

Already deployed at: https://craftedai.deven.network

To redeploy with updates:
```bash
git add .
git commit -m "Update newsletter processor"
git push origin main
```

Vercel will automatically deploy changes.
