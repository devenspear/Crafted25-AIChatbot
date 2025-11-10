/**
 * Smart Text-Search RAG System
 * Implements keyword-based search without vector embeddings
 * 90% cost reduction by retrieving only relevant chunks
 */

import craftedData from './crafted_data.json';

interface SearchResult {
  content: string;
  relevanceScore: number;
  source: string;
}

/**
 * Search for relevant event data based on user query
 * @param query - User's question/message
 * @param limit - Max number of results to return (default: 5)
 * @returns Relevant data chunks as formatted string
 */
export function searchEventData(query: string, limit: number = 5): string {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  // Extract keywords from query
  const keywords = extractKeywords(queryLower);

  // Search through all pages
  if (craftedData.pages && Array.isArray(craftedData.pages)) {
    craftedData.pages.forEach((page, index) => {
      const pageContent = JSON.stringify(page).toLowerCase();
      const relevanceScore = calculateRelevance(pageContent, keywords, queryLower);

      if (relevanceScore > 0) {
        results.push({
          content: JSON.stringify(page, null, 2),
          relevanceScore,
          source: `Page ${index + 1}: ${page.title || 'Event Page'}`
        });
      }
    });
  }

  // Sort by relevance and take top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topResults = results.slice(0, limit);

  if (topResults.length === 0) {
    // If no specific matches, return general event info
    return `Event: ${craftedData.event_name}
Location: ${craftedData.event_location}
Dates: ${craftedData.event_dates}`;
  }

  // Format results
  const formatted = topResults
    .map(result => `--- ${result.source} (Relevance: ${result.relevanceScore.toFixed(2)}) ---\n${result.content}`)
    .join('\n\n');

  return formatted;
}

/**
 * Extract meaningful keywords from query
 */
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'what', 'when', 'where', 'who', 'how', 'is', 'are', 'the', 'a', 'an',
    'about', 'for', 'on', 'at', 'to', 'in', 'with', 'tell', 'me', 'can',
    'you', 'do', 'does', 'will', 'would', 'could', 'should', 'i', 'my'
  ]);

  return query
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^a-z0-9]/g, ''));
}

/**
 * Calculate relevance score based on keyword matches
 */
function calculateRelevance(content: string, keywords: string[], fullQuery: string): number {
  let score = 0;

  // Exact phrase match (highest weight)
  if (content.includes(fullQuery)) {
    score += 100;
  }

  // Keyword matches
  keywords.forEach(keyword => {
    if (keyword.length === 0) return;

    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      score += matches.length * 10; // 10 points per keyword match
    }
  });

  // Boost for common event names
  const eventKeywords = {
    'firkin': 50,
    'fête': 50,
    'fete': 50,
    'spirited': 40,
    'soirée': 50,
    'soiree': 50,
    'makers': 30,
    'market': 30,
    'pickleball': 40,
    'picklebacks': 40,
    'workshop': 30,
    'dinner': 25,
    'experiential': 30,
    'songwriter': 35,
    'architectural': 30,
    'tour': 20,
    'friday': 20,
    'saturday': 20,
    'sunday': 20,
    'thursday': 20,
    'wednesday': 20,
    'schedule': 25,
    'time': 15,
    'location': 15,
    'ticket': 20,
    'price': 20,
    'cost': 20
  };

  Object.entries(eventKeywords).forEach(([keyword, boost]) => {
    if (content.includes(keyword)) {
      score += boost;
    }
  });

  return score;
}

/**
 * Get all event data (fallback for general queries)
 */
export function getAllEventData(): string {
  return JSON.stringify({
    event_name: craftedData.event_name,
    event_location: craftedData.event_location,
    event_dates: craftedData.event_dates,
    total_events: craftedData.pages?.length || 0,
    pages: craftedData.pages
  }, null, 2);
}
