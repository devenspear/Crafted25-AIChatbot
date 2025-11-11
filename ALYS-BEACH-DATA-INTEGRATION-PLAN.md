# Alys Beach Data Integration Plan

## 📊 Data Analysis Complete

### Current CRAFTED Data (`crafted_data.json`)
- **Focus**: CRAFTED event (Nov 12-16, 2025)
- **Size**: ~78KB
- **Structure**: Complex nested JSON with pages, headings, content
- **Content**: Event schedules, speakers, workshops, ticketing, sponsors
- **Categories**: Event-specific information

### New Alys Beach Data (`alysbeach_data.json`)
- **Focus**: Alys Beach community/venue
- **Size**: ~65KB
- **Structure**: Simple array with url, title, content, category
- **Content**: Venue amenities, dining, architecture, real estate, policies
- **Categories**: home, real-estate, about, merchants, news, weddings, careers, legal

---

## 🎯 Integration Strategy

### **Option 1: Unified Combined Dataset (RECOMMENDED)**

Create a new combined file that merges both datasets with proper categorization.

**Advantages:**
- ✅ Single source of truth
- ✅ Comprehensive context for RAG
- ✅ Users can ask about events OR venue
- ✅ Better user experience

**Example User Queries This Enables:**
```
"Where is CRAFTED happening?" → Alys Beach venue info
"What restaurants are near the Firkin Fête?" → Merchants data
"Tell me about the architecture" → Alys Beach architecture
"Can I use the pool during CRAFTED?" → Caliza Pool + Beach Club info
"What time is Spirited Soirée?" → Event schedule
"Where should I stay?" → Real estate/vacation rentals
```

**Implementation:**
```javascript
{
  "event_info": {
    "name": "CRAFTED 2025",
    "dates": "November 12-16, 2025",
    "location": "Alys Beach, Florida"
  },
  "data": [
    // CRAFTED event pages (tagged as "event")
    {
      "source": "event",
      "category": "schedule",
      "url": "...",
      "title": "...",
      "content": "..."
    },
    // Alys Beach venue pages (tagged as "venue")
    {
      "source": "venue",
      "category": "amenities",
      "url": "https://alysbeach.com/about/the-beach/",
      "title": "The Beach at Alys Beach",
      "content": "..."
    }
  ]
}
```

---

### **Option 2: Separate Datasets with Dual RAG Search**

Keep files separate but search both during RAG queries.

**Advantages:**
- ✅ Maintains data separation
- ✅ Easy to update independently

**Disadvantages:**
- ⚠️ More complex search logic
- ⚠️ Potential for redundant results

---

### **Option 3: Context-Aware Layered Approach**

Use CRAFTED data as primary, Alys Beach as supplementary context.

**Implementation:**
- Always search CRAFTED data first
- If query is venue-related, also search Alys Beach data
- Combine results intelligently

---

## 📋 Recommended Implementation Plan

### **Phase 1: Data Transformation** (10 minutes)

1. Create `lib/combined_data.json`
2. Transform Alys Beach entries to match structure:
   ```javascript
   {
     "source": "venue",
     "category": "amenities|dining|architecture|etc",
     "url": "https://alysbeach.com/...",
     "title": "...",
     "content": "...",
     "keywords": ["beach", "pool", "dining", "architecture"]
   }
   ```
3. Transform CRAFTED entries:
   ```javascript
   {
     "source": "event",
     "category": "schedule|workshop|speaker|etc",
     "url": "https://www.alysbeachcrafted.com/...",
     "title": "...",
     "content": "...",
     "keywords": ["firkin", "soiree", "workshop", "schedule"]
   }
   ```

### **Phase 2: RAG Search Enhancement** (5 minutes)

Update `lib/rag-search.ts`:
```typescript
export function searchEventData(query: string, limit: number = 5) {
  const lowerQuery = query.toLowerCase();

  // Score results from both sources
  const allResults = combinedData.data.map(page => {
    let score = 0;

    // Boost event data for event-specific queries
    if (page.source === 'event' && isEventQuery(query)) {
      score += 10;
    }

    // Boost venue data for venue-specific queries
    if (page.source === 'venue' && isVenueQuery(query)) {
      score += 10;
    }

    // Rest of scoring logic...
  });

  return topResults;
}
```

### **Phase 3: Enhanced System Prompt** (2 minutes)

Update `lib/system-prompt.ts`:
```typescript
You are the CRAFTED AI Assistant for the CRAFTED 2025 event
happening November 12-16, 2025 at Alys Beach, Florida.

You have access to:
1. CRAFTED event information (schedules, workshops, speakers, tickets)
2. Alys Beach venue information (amenities, dining, architecture, policies)

When users ask about:
- Events, schedules, workshops → Focus on CRAFTED event data
- Venue, location, amenities, dining → Use Alys Beach venue data
- Both → Combine intelligently
```

---

## 🎨 Content Categorization

### Alys Beach Data Categories:
```
amenities     → Beach Club, Caliza Pool, ZUMA Wellness
dining        → Restaurants, merchants, food/beverage
architecture  → Design philosophy, building types
accommodations→ Vacation rentals, real estate
policies      → Photography, weddings, privacy
```

### CRAFTED Event Categories:
```
schedule   → Daily events, times, locations
workshops  → Hands-on sessions, makers
speakers   → Featured guests, talks
dining     → Event-specific food/beverage
tickets    → Pricing, registration
sponsors   → Partners, supporters
```

---

## 💡 Smart Query Routing Examples

| User Query | Data Source | Category |
|------------|-------------|----------|
| "What time is Firkin Fête?" | CRAFTED | schedule |
| "Tell me about George's restaurant" | Alys Beach | dining |
| "Can I use ZUMA during CRAFTED?" | Both | amenities + event |
| "What workshops are on Saturday?" | CRAFTED | workshops |
| "Where is the Beach Club?" | Alys Beach | amenities |
| "Any food at Spirited Soirée?" | CRAFTED | event dining |

---

## 📈 Expected Benefits

### For Users:
- ✅ One-stop information source
- ✅ Contextual venue details without leaving chat
- ✅ Better trip planning (events + amenities + dining)
- ✅ Reduced confusion about "where things are"

### For RAG Performance:
- ✅ ~140KB total data (well within limits)
- ✅ Still 93% cost savings vs. full context
- ✅ Better relevance scoring
- ✅ Reduced "I don't know" responses

---

## 🚀 Implementation Checklist

- [ ] Create `lib/data-transformer.ts` script
- [ ] Generate `lib/combined_data.json`
- [ ] Update `lib/rag-search.ts` to use combined data
- [ ] Add source/category-based scoring
- [ ] Update `lib/system-prompt.ts` with dual context
- [ ] Test with sample queries
- [ ] Verify response quality
- [ ] Deploy to production

---

## 🧪 Test Queries After Integration

```
Event-Specific:
- "What's on Saturday?"
- "Tell me about the Firkin Fête"
- "Any workshops for kids?"

Venue-Specific:
- "What restaurants are nearby?"
- "Can I swim at Caliza Pool?"
- "Tell me about Alys Beach architecture"

Hybrid:
- "Where can I eat during CRAFTED?"
- "What amenities are included with my ticket?"
- "Best places to relax between events?"
```

---

## 💰 Cost Impact

**Before**: 78KB CRAFTED data
**After**: 140KB combined data (78KB + 62KB)

**Token Impact**:
- Current: ~20 tokens per query (RAG)
- After: ~35 tokens per query (still 90%+ savings vs. full context)

**Still FREE tier**: ✅
**Still cost-effective**: ✅

---

## 🎯 Recommendation

**Implement Option 1: Unified Combined Dataset**

**Timeline**: 20 minutes total
- Data transformation: 10 min
- RAG update: 5 min
- System prompt update: 2 min
- Testing: 3 min

**Priority**: HIGH - Significantly improves user experience

---

**Ready to implement? Say "yes, integrate Alys Beach data" and I'll do it!**
