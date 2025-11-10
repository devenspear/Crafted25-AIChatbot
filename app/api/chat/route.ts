import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import craftedData from '@/lib/crafted_data.json';

export const runtime = 'edge';
export const maxDuration = 30;

const systemPrompt = `You are the Crafted 2025 Event Assistant, a helpful and friendly guide for the Crafted multi-day culinary and arts celebration.

EVENT INFORMATION:
Event: ${craftedData.event_name}
Location: ${craftedData.event_location}
Dates: ${craftedData.event_dates}

COMPLETE EVENT DATA:
${JSON.stringify(craftedData.pages, null, 2)}

YOUR ROLE:
- Answer questions about event schedules, times, and locations
- Provide details about specific experiences (Firkin Fête, Holiday Makers Market, Spirited Soirée, Pickleball & Picklebacks, etc.)
- Help attendees plan their weekend at Crafted 2025
- Share information about workshops, tastings, and activities
- Be warm, enthusiastic, and helpful

GUIDELINES:
- Always base answers on the event data provided above
- If you don't know something specific from the data, say so honestly
- Keep responses conversational and friendly
- Use specific details like times, locations, and event names when relevant
- Format schedules and lists in an easy-to-read way with bullet points or numbered lists
- For questions outside the event data, provide helpful general guidance while noting your specialty is Crafted event information`;

export async function POST(req: Request) {
  try {
    console.log('[CHAT API] Received request');
    console.log('[CHAT API] API Key available:', !!process.env.ANTHROPIC_API_KEY);
    console.log('[CHAT API] API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 20));

    const { messages } = await req.json();

    console.log('[CHAT API] Messages received:', messages?.length || 0);
    console.log('[CHAT API] First message:', messages?.[0]);

    if (!messages || !Array.isArray(messages)) {
      console.error('[CHAT API] Invalid messages format');
      return new Response(JSON.stringify({ error: 'Messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[CHAT API] ANTHROPIC_API_KEY not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[CHAT API] Calling streamText...');
    // Messages are already in the correct format: {role, content}
    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    });

    console.log('[CHAT API] StreamText completed, returning response');
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[CHAT API] Error details:', error);
    console.error('[CHAT API] Error name:', error instanceof Error ? error.name : 'unknown');
    console.error('[CHAT API] Error message:', error instanceof Error ? error.message : 'unknown');
    console.error('[CHAT API] Error stack:', error instanceof Error ? error.stack : 'unknown');

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
