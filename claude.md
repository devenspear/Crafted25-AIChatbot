# Crafted 2025 AI Assistant - Development Guide

## Automatic Version Incrementing

The version number in the footer automatically increments with every GitHub push to Vercel.

### How It Works

The version is generated using Vercel's built-in environment variables:
- Base version: `1.0.x`
- The `x` is automatically generated from the Git commit SHA
- Format: `1.0.{short-commit-hash}`

### Implementation

The version is displayed in the footer component at `app/page.tsx`:

```typescript
// Uses Vercel's NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA environment variable
const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  ? `1.0.${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 7)}`
  : '1.0.dev';
```

### Vercel Environment Variables Used

- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` - The Git commit SHA of the deployment
- Available automatically in all Vercel deployments
- No configuration needed

### Version Format

- **Production**: `1.0.abc1234` (where abc1234 is the short commit SHA)
- **Local Development**: `1.0.dev`

### Manual Version Updates

If you need to change the base version (e.g., from 1.0 to 2.0):
1. Edit `app/page.tsx`
2. Change the base version in the version string construction
3. Commit and push to GitHub

## Deployment Process

### ✅ Correct Workflow (Automatic Versioning)

1. Make code changes
2. Commit changes: `git add . && git commit -m "your message"`
3. Push to GitHub: `git push`
4. Vercel automatically deploys with new version number
5. Version increments automatically based on commit SHA

### ❌ Incorrect Workflow

- Do NOT run `vercel --prod` manually (creates duplicate deployments)
- Do NOT manually update version in package.json for every commit
- Let Vercel's GitHub integration handle deployments

## Project Structure

```
crafted-assistant/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Claude AI API endpoint
│   ├── page.tsx                   # Main chat UI with version footer
│   └── layout.tsx
├── lib/
│   └── crafted_data.json          # Event data (70KB)
├── .env.local                     # ANTHROPIC_API_KEY
├── package.json
└── claude.md                      # This file
```

## Environment Variables

### Local Development (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Vercel Production
Set in Vercel Dashboard → Project Settings → Environment Variables:
- `ANTHROPIC_API_KEY` - Your Anthropic API key

Vercel automatically provides:
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `VERCEL_URL`

## Debugging

### Check Version Number
- View footer at bottom of chat interface
- Should show: `Crafted 2025 AI Assistant v1.0.{commit-sha}`

### Logs
- Browser Console: Shows UI streaming logs
- Vercel Functions: View in Vercel Dashboard → Deployments → Function Logs
- Local Dev: Shows in terminal running `npm run dev`

## Common Issues

### Version Shows "1.0.dev"
- This is expected in local development
- Production deployments will show commit SHA

### Duplicate Deployments
- Only push to GitHub, don't run `vercel` CLI manually
- Vercel GitHub integration auto-deploys

### Version Not Updating
- Check that you committed and pushed to GitHub
- Each commit has a unique SHA, so version will be unique
- Verify in Vercel dashboard that deployment completed

## Tech Stack

- **Framework**: Next.js 16.0.1 (Turbopack)
- **Runtime**: Edge (for API routes)
- **AI Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Styling**: Tailwind CSS 4.0
- **Deployment**: Vercel (auto-deploy via GitHub)
- **AI SDK**: Vercel AI SDK (@ai-sdk/anthropic, ai)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start
```

## Git Workflow

**IMPORTANT**: All changes must be pushed to the `main` branch only. No feature branches or RAG branches.

```bash
# Make changes to code
# ...

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Description of changes"

# Push to main branch (triggers Vercel production deployment)
git push origin main

# Version automatically increments based on commit SHA
# Changes go live immediately in Vercel production
```

### Branch Policy
- **Main branch only**: All commits push directly to `main`
- **No feature branches**: No RAG branch, no claude/* branches
- **Live deployment**: Every push to main deploys to production immediately
- **Vercel configuration**: Main branch is configured as production branch

## Notes

- Every GitHub push creates a new deployment with unique version
- Version format: `1.0.{7-char-commit-sha}`
- No manual version bumping required
- Commit SHA ensures every deployment is uniquely identifiable
