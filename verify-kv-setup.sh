#!/bin/bash

# Vercel KV Setup Verification Script
# Run this after creating the KV database in Vercel dashboard

echo "=========================================="
echo "Vercel KV Setup Verification"
echo "=========================================="
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check project link
echo "Checking Vercel project link..."
if [ ! -d ".vercel" ]; then
    echo "❌ Project not linked to Vercel"
    echo "   Run: vercel link"
    exit 1
fi

echo "✅ Project linked to Vercel"
echo ""

# Check environment variables
echo "Checking KV environment variables..."
echo "---"
vercel env ls | grep -E "(KV_|ANTHROPIC)" || echo "No KV variables found yet"
echo "---"
echo ""

# Check if KV variables exist
if vercel env ls | grep -q "KV_URL"; then
    echo "✅ KV environment variables detected!"
    echo ""
    echo "KV Setup Status: COMPLETE ✅"
    echo ""
    echo "Next steps:"
    echo "1. Pull env vars to local: vercel env pull .env.local"
    echo "2. Test locally: npm run dev"
    echo "3. Deploy to production: vercel --prod"
    echo ""
    echo "Your analytics will now persist across deployments!"
else
    echo "⚠️  KV environment variables NOT found"
    echo ""
    echo "Please complete KV database setup:"
    echo "1. Visit: https://vercel.com/deven-projects/crafted-assistant/stores"
    echo "2. Create KV database"
    echo "3. Connect to project: crafted-assistant"
    echo "4. Run this script again to verify"
    echo ""
    echo "See VERCEL-KV-SETUP.md for detailed instructions"
fi

echo ""
echo "=========================================="
