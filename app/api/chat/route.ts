import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { searchEventData } from '@/lib/rag-search';
import { getSystemPrompt } from '@/lib/system-prompt';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Anthropic client with explicit API key for Edge runtime
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // RAG: Extract user's last message to search relevant data
    const lastMessage = messages[messages.length - 1];
    const userQuery = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    // Smart search: Only retrieve relevant event data (5KB vs 78KB)
    // This reduces costs by ~93% while maintaining accuracy
    const relevantData = searchEventData(userQuery, 5);

    // Enhanced system prompt with brand voice + relevant data only
    const systemPrompt = getSystemPrompt(relevantData);

    // Stream response with Claude 3.5 Haiku (fast, cost-effective)
    const result = await streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to process chat request',
      details: errorMessage,
      name: error instanceof Error ? error.name : 'unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
