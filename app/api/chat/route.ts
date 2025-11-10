import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { searchEventData } from '@/lib/rag-search';
import { getSystemPrompt } from '@/lib/system-prompt';
import { trackMessage, trackResponseTime, trackTokens, trackError } from '@/lib/analytics';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();

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

    // Initialize Anthropic client with explicit API key
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // RAG: Extract user's last message to search relevant data
    const lastMessage = messages[messages.length - 1];
    const userQuery = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    // Track the message (async, don't block)
    trackMessage(userQuery, req).catch(console.error);

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
      onFinish: async ({ usage }) => {
        // Track metrics after completion (async, don't block)
        const responseTime = Date.now() - startTime;

        Promise.all([
          trackResponseTime(responseTime),
          trackTokens(usage.promptTokens, usage.completionTokens),
        ]).catch(console.error);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // Track error (async, don't block)
    trackError(error as Error).catch(console.error);

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
