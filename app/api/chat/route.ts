import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { searchEventData } from '@/lib/rag-search';
import { getSystemPrompt } from '@/lib/system-prompt';
import {
  generateSessionId,
  trackChatRequest,
  trackChatResponse,
  trackError,
} from '@/lib/analytics-kv';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();
  let sessionId = '';

  try {
    const { messages, sessionId: clientSessionId } = await req.json();

    // Use client session ID or generate new one
    sessionId = clientSessionId || generateSessionId();

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

    // Track the chat request
    console.log('[Analytics] Tracking request:', { sessionId, query: userQuery.substring(0, 50) });
    await trackChatRequest(sessionId, userQuery);
    console.log('[Analytics] Request tracked successfully');

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

    // Track response metrics (estimate tokens for now)
    const responseTime = Date.now() - startTime;
    const estimatedInputTokens = Math.ceil(systemPrompt.length / 4);
    const estimatedOutputTokens = 100; // Will be more accurate with actual response

    await trackChatResponse(
      sessionId,
      responseTime,
      {
        input: estimatedInputTokens,
        output: estimatedOutputTokens,
      },
      'claude-3-5-haiku-20241022',
      relevantData.length
    );

    // Add session ID to response headers
    const response = result.toTextStreamResponse();
    response.headers.set('X-Session-ID', sessionId);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Track the error
    if (sessionId) {
      await trackError(sessionId, errorMessage, 500);
    }

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
