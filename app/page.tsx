'use client';

import { useState, useRef, useEffect } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-increment version based on git commit SHA
  const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? `1.0.${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 7)}`
    : '1.0.dev';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* iOS-style Header with glassmorphism */}
      <div className="backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm px-4 py-3 safe-area-top sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-serif text-center text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>CRAFTED 2025</h1>
          <p className="text-xs text-center text-gray-500 mt-0.5 font-light">Alys Beach, Florida • Nov 12–16</p>
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

      {/* Messages Container - iMessage style */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center mt-8 px-4">
            <div className="mb-8 backdrop-blur-md bg-white/60 rounded-3xl p-8 shadow-lg border border-gray-100/50">
              <h2 className="text-3xl font-serif text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome to Crafted 2025
              </h2>
              <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                A multi-day journey of culinary expression, spirited tastings, and hands-on discovery.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {suggestedQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(sq.question);
                  }}
                  className="backdrop-blur-md bg-white/70 hover:bg-white/90 rounded-2xl p-4 shadow-sm hover:shadow-md border border-gray-100/50 transition-all duration-200 text-left group active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sq.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm group-hover:text-[#004978] transition-colors">{sq.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sq.question}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}
          >
            <div
              className={`max-w-[75%] sm:max-w-[70%] rounded-3xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#004978] text-white shadow-md'
                  : 'backdrop-blur-md bg-gray-100/80 text-gray-900 border border-gray-200/50'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
            <div className="backdrop-blur-md bg-gray-100/80 rounded-3xl px-5 py-3.5 border border-gray-200/50">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* iOS-style Input Bar with glassmorphism */}
      <div className="backdrop-blur-xl bg-white/80 border-t border-gray-200/30 px-4 py-3 pb-safe safe-area-bottom">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message"
                className="w-full px-4 py-2.5 sm:py-3 rounded-full bg-gray-100/80 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-[#004978]/30 focus:border-[#004978]/50 text-gray-900 placeholder-gray-500 text-[16px] transition-all backdrop-blur-sm"
                disabled={isLoading}
                autoComplete="off"
                style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                input.trim() && !isLoading
                  ? 'bg-[#004978] hover:bg-[#003a60] shadow-md'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          {/* Subtle footer */}
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">
              Crafted 2025 v{version} • Claude 3.5 Haiku
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
