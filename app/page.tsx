'use client';

import { useState, useRef } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[UI] Form submitted with input:', input);

    if (!input.trim()) {
      console.warn('[UI] Empty input, ignoring submit');
      return;
    }

    if (isLoading) {
      console.warn('[UI] Already loading, ignoring submit');
      return;
    }

    const userMessage = input;
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    console.log('[UI] Added user message:', userMsg);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      console.log('[UI] Sending fetch to /api/chat...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('[UI] Response received, status:', response.status);
      console.log('[UI] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      console.log('[UI] Starting to read stream...');

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
      }]);

      let chunkCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        console.log('[UI] Read chunk:', { done, valueLength: value?.length });

        if (done) {
          console.log('[UI] Stream done');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('[UI] Decoded chunk:', chunk.substring(0, 100));
        assistantContent += chunk;
        chunkCount++;

        // Update assistant message with accumulated content
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: assistantContent } : m
        ));
      }

      console.log('[UI] Stream complete, chunks:', chunkCount, 'content length:', assistantContent.length);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[UI] Request aborted');
        return;
      }
      console.error('[UI] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const suggestedQuestions = [
    { emoji: '📅', title: 'Saturday Schedule', question: 'What events are happening on Saturday?' },
    { emoji: '🍺', title: 'Firkin Fête', question: 'Tell me about the Firkin Fête' },
    { emoji: '✨', title: 'Workshops', question: 'What workshops are available?' },
    { emoji: '🗓️', title: 'Full Schedule', question: 'Show me the full event schedule' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100">
      {/* Header - Alys Beach inspired white/neutral palette */}
      <div className="bg-white border-b border-stone-200 shadow-sm p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-stone-800 tracking-wide">CRAFTED 2025</h1>
          <p className="text-stone-600 mt-2 font-light">November 12–16 • Alys Beach, Florida</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center mt-16 px-4">
            <h2 className="text-3xl font-light text-stone-700 mb-3">
              Welcome to Crafted 2025
            </h2>
            <p className="text-stone-600 mb-8 font-light max-w-lg mx-auto">
              A multi-day journey of culinary expression, spirited tastings, and hands-on discovery. Ask me anything about the schedule, experiences, or activities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {suggestedQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    console.log('[UI] Suggested question clicked:', sq.question);
                    setInput(sq.question);
                  }}
                  className="p-5 bg-white border border-stone-200 rounded-sm hover:border-stone-400 hover:shadow-lg transition-all text-left group"
                >
                  <p className="font-light text-stone-800 text-lg mb-1 group-hover:text-stone-900">{sq.emoji} {sq.title}</p>
                  <p className="text-sm text-stone-500 font-light">{sq.question}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-sm p-4 ${
                message.role === 'user'
                  ? 'bg-stone-700 text-white'
                  : 'bg-white text-stone-800 border border-stone-200 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap font-light leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-sm p-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-stone-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              value={input}
              onChange={(e) => {
                console.log('[UI] Input changed:', e.target.value);
                setInput(e.target.value);
              }}
              placeholder="Ask about events, schedules, or experiences..."
              className="flex-1 p-4 border border-stone-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-800 placeholder-stone-400 bg-white font-light"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-8 py-4 bg-stone-700 text-white rounded-sm font-light tracking-wide hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-sm"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {/* Debug info */}
          <div className="text-xs text-stone-400 mt-2">
            Status: {isLoading ? 'loading' : 'ready'} | Messages: {messages.length} | Input: {input.length} chars
          </div>
        </form>

        {/* Footer */}
        <div className="text-center py-3 border-t border-stone-100 mt-3">
          <p className="text-xs text-stone-400 font-light">
            Crafted 2025 AI Assistant v1.0.0 • Powered by Claude 3.5 Sonnet
          </p>
        </div>
      </div>
    </div>
  );
}
