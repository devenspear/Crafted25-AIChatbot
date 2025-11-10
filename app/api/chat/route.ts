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
    const { messages } = await req.json();

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
