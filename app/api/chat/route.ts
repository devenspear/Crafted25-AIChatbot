import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import { searchEventData } from '@/lib/rag-search';
import { getSystemPrompt } from '@/lib/system-prompt';
import {
  generateSessionId,
  trackChatRequest,
  trackChatResponse,
  trackError,
} from '@/lib/analytics-kv';
import { chatRateLimit, getClientIP, checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();
  let sessionId = '';

  try {
    // Security: Rate limiting (20 requests/minute per IP)
    const clientIP = getClientIP(req);
    const rateLimitResponse = await checkRateLimit(chatRateLimit, clientIP);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { messages, sessionId: clientSessionId, userId, device, location, performance, newsletterMode } = await req.json();

    // Use client session ID or generate new one
    sessionId = clientSessionId || generateSessionId();

    // Security: Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Security: Limit number of messages to prevent context exhaustion
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: 'Too many messages (max 50)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Security: Validate message content length
    for (const message of messages) {
      const content = typeof message.content === 'string' ? message.content : '';
      if (content.length > 10000) {
        return new Response(JSON.stringify({ error: 'Message too long (max 10,000 characters)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    // Newsletter mode: Return complete text (non-streaming) for batch processing
    if (newsletterMode) {
      console.log('[Newsletter API] Processing in newsletter mode - BYPASSING ANALYTICS');
      console.log('[Newsletter API] Processing in newsletter mode');
      console.log('[Newsletter API] Message length:', messages[0]?.content?.length ?? 0);

      try {
        const result = await generateText({
          model: anthropic('claude-3-5-sonnet-20241022'), // Use Sonnet for better analysis
          messages: messages,
          temperature: 0.3, // Lower temperature for more consistent formatting
        });

        console.log('[Newsletter API] Claude response received');
        console.log('[Newsletter API] Response length:', result.text.length);
        console.log('[Newsletter API] First 200 chars:', result.text.substring(0, 200));

        const responseTime = Date.now() - startTime;

        // Track analytics (don't let this fail the request)
        try {
          await trackChatResponse(
            sessionId,
            responseTime,
            {
              input: result.usage?.inputTokens ?? 0,
              output: result.usage?.outputTokens ?? 0,
            },
            'claude-3-5-sonnet-20241022',
            0,
            userId
          );
        } catch (analyticsError) {
          console.error('[Newsletter API] Analytics tracking failed:', analyticsError);
        }

        return new Response(JSON.stringify({ content: result.text }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId,
          },
        });
      } catch (claudeError) {
        console.error('[Newsletter API] Claude API error:', claudeError);
        return new Response(JSON.stringify({
          error: 'Claude API failed',
          details: claudeError instanceof Error ? claudeError.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Regular chat mode - with RAG and analytics
    // RAG: Extract user's last message to search relevant data
    const lastMessage = messages[messages.length - 1];
    const userQuery = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    // Track the chat request with user ID and device context
    console.log('[Analytics] Tracking request:', { sessionId, userId, query: userQuery.substring(0, 50) });
    await trackChatRequest(sessionId, userQuery, userId, device, location, performance);
    console.log('[Analytics] Request tracked successfully');

    // Smart search: Only retrieve relevant event data (5KB vs 78KB)
    // This reduces costs by ~93% while maintaining accuracy
    const relevantData = searchEventData(userQuery, 5);

    // Enhanced system prompt with brand voice + relevant data only
    const systemPrompt = getSystemPrompt(relevantData);

    // Stream response with Claude 3.5 Haiku (fast, cost-effective)
    const result = streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
      onFinish: async (event) => {
        // Track actual token usage after stream completes
        const responseTime = Date.now() - startTime;
        // AI SDK uses .inputTokens and .outputTokens
        const actualInputTokens = event.usage?.inputTokens ?? Math.ceil(systemPrompt.length / 4);
        const actualOutputTokens = event.usage?.outputTokens ?? 100;

        console.log('[Analytics] Tracking response with actual tokens:', {
          input: actualInputTokens,
          output: actualOutputTokens,
          responseTime,
          usage: event.usage,
        });

        await trackChatResponse(
          sessionId,
          responseTime,
          {
            input: actualInputTokens,
            output: actualOutputTokens,
          },
          'claude-3-5-haiku-20241022',
          relevantData.length,
          userId
        );
      },
    });

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
