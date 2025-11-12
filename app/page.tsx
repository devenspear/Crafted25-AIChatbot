'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SettingsMenu, { Theme, FontSize } from '@/components/SettingsMenu';
import { getUserId, incrementUserMessageCount, getUserProfile } from '@/lib/user-tracking';

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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-increment version based on git commit SHA
  const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? `1.0.${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 7)}`
    : '1.0.dev';

  // Font size class mapping
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  // Initialize settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('crafted_theme') as Theme | null;
    const savedFontSize = localStorage.getItem('crafted_fontSize') as FontSize | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('crafted_theme', theme);
  }, [theme]);

  // Save font size to localStorage
  useEffect(() => {
    localStorage.setItem('crafted_fontSize', fontSize);
  }, [fontSize]);

  // Initialize user ID and session ID
  useEffect(() => {
    // Get or create unique user ID (persists across sessions)
    const userIdFromStorage = getUserId();
    setUserId(userIdFromStorage);

    // Get or create session ID (temporary for this tab/session)
    const existingSessionId = sessionStorage.getItem('crafted_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('crafted_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

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
    setIsFirstLoad(false);

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

      // Get user profile for device context
      const userProfile = getUserProfile();

      console.log('[UI] Sending fetch to /api/chat...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId: sessionId,
          userId: userId, // Include user ID for tracking
          device: userProfile?.device,
          location: userProfile?.location,
          performance: userProfile?.performance,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Track user message
      incrementUserMessageCount();

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
    { emoji: '🍺', title: 'Firkin Fête', subtitle: 'Rare cask ales & tastings.', question: 'When is the Firkin Fête and what can I expect?' },
    { emoji: '🎨', title: 'Holiday Makers Market', subtitle: 'Artisan crafts & gifts.', question: 'Tell me about the Holiday Makers Market schedule' },
    { emoji: '🍹', title: 'Spirited Soirée', subtitle: 'Cocktails, music & culinary.', question: 'What is the Spirited Soirée?' },
    { emoji: '📅', title: 'Saturday Events', subtitle: 'Full Saturday schedule.', question: 'What events are happening on Saturday?' },
  ];

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-gray-900 to-gray-800'
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      {/* iOS-style Header with glassmorphism - Fixed/Locked */}
      <div
        className={`backdrop-blur-xl border-b shadow-sm px-4 py-2.5 sm:py-3 fixed top-0 left-0 right-0 z-50 ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700/50'
            : 'bg-white/80 border-gray-200/50'
        }`}
        style={{
          position: 'fixed',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
          minHeight: '3.5rem',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="w-10"></div> {/* Spacer for centering */}
          <div className="flex-1 cursor-pointer" onClick={() => window.location.reload()}>
            <h1
              className={`font-serif text-center tracking-tight text-xl sm:text-2xl md:text-3xl ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              style={{
                fontFamily: 'Georgia, serif',
                lineHeight: '1.2',
              }}
            >
              CRAFTED CONCIERGE
            </h1>
            <p className={`text-[10px] sm:text-xs text-center mt-0.5 font-light ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Alys Beach, Florida • Nov 12–16</p>
          </div>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-10 h-10 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 active:bg-gray-700'
                : 'hover:bg-gray-100 active:bg-gray-200'
            }`}
            aria-label="Open settings"
          >
            <span className={`w-5 h-0.5 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
            }`}></span>
            <span className={`w-5 h-0.5 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
            }`}></span>
            <span className={`w-5 h-0.5 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
            }`}></span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`border-l-4 border-red-500 p-4 mx-4 fixed top-16 left-0 right-0 z-40 ${
          theme === 'dark' ? 'bg-red-900/50' : 'bg-red-50'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${theme === 'dark' ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
              <button
                onClick={() => setError(null)}
                className={`text-xs underline mt-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container - iMessage style */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-3xl mx-auto w-full" style={{ paddingTop: 'calc(3.5rem + 1.5rem)' }}>
        {messages.length === 0 && (
          <div className="text-center mt-8 px-4">
            <div className="mb-8 p-6 sm:p-8">
              <p className={`leading-relaxed max-w-2xl mx-auto ${fontSizeClasses[fontSize]} ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                From first pour to final toast, consider me your AI compass for all things CRAFTED. Tell me a time, a craving, or a curiosity, and I'll guide you to what's happening next—from workshops to signature soirées. Think of me as the festival desk in your pocket, offering clear, CRAFTED-only answers so you can wander more and scroll less.
              </p>
            </div>
            <p className={`mb-4 text-center ${fontSizeClasses[fontSize]} ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Try asking about:
            </p>
            <style jsx>{`
              @keyframes rollingHighlight {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
              .rolling-highlight-button {
                background: linear-gradient(
                  90deg,
                  ${theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.7)'} 0%,
                  rgba(0, 73, 120, 0.1) 25%,
                  rgba(0, 73, 120, 0.2) 50%,
                  rgba(0, 73, 120, 0.1) 75%,
                  ${theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.7)'} 100%
                );
                background-size: 200% 100%;
                animation: rollingHighlight 3s ease-in-out infinite;
              }
              .rolling-highlight-button:hover {
                background: ${theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
                animation: none;
              }
            `}</style>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {suggestedQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(sq.question);
                  }}
                  className={`backdrop-blur-md rolling-highlight-button rounded-2xl p-4 shadow-sm hover:shadow-md border transition-all duration-200 text-left group active:scale-95 ${
                    theme === 'dark'
                      ? 'border-gray-700/50 hover:bg-gray-800/90'
                      : 'border-gray-100/50 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sq.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold group-hover:text-[#004978] transition-colors ${fontSizeClasses[fontSize]} ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{sq.title}</p>
                      <p className={`text-xs mt-0.5 italic ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>{sq.subtitle}</p>
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
                  : theme === 'dark'
                  ? 'backdrop-blur-md bg-gray-700/80 text-gray-100 border border-gray-600/50'
                  : 'backdrop-blur-md bg-gray-100/80 text-gray-900 border border-gray-200/50'
              }`}
            >
              <div className={`whitespace-pre-wrap leading-relaxed ${fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
            <div className={`backdrop-blur-md rounded-3xl px-5 py-3.5 border ${
              theme === 'dark'
                ? 'bg-gray-700/80 border-gray-600/50'
                : 'bg-gray-100/80 border-gray-200/50'
            }`}>
              <div className="flex items-center space-x-1.5">
                <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-300' : 'bg-gray-400'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${theme === 'dark' ? 'bg-gray-300' : 'bg-gray-400'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${theme === 'dark' ? 'bg-gray-300' : 'bg-gray-400'}`}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* iOS-style Input Bar with glassmorphism */}
      <div className={`backdrop-blur-xl border-t px-4 py-3 pb-safe safe-area-bottom ${
        theme === 'dark'
          ? 'bg-gray-900/80 border-gray-700/30'
          : 'bg-white/80 border-gray-200/30'
      }`}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isFirstLoad ? "Ask something..." : ""}
                className={`w-full px-4 py-2.5 sm:py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#004978]/30 focus:border-[#004978]/50 text-[16px] transition-all backdrop-blur-sm ${
                  theme === 'dark'
                    ? 'bg-gray-800/80 border-gray-700/50 text-white placeholder-gray-400'
                    : 'bg-gray-100/80 border-gray-200/50 text-gray-900 placeholder-gray-500'
                }`}
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
                  : theme === 'dark'
                  ? 'bg-gray-700 cursor-not-allowed'
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

          {/* Footer disclaimer */}
          <div className="text-center mt-3 px-2">
            <p className={`text-[10px] sm:text-xs leading-relaxed max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              This is a conceptual prototype—experimental and not officially endorsed by Alys Beach or EBSCO Gulf Coast Development.
            </p>
            <p className={`text-[9px] mt-1 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              v{version} • Claude 3.5 Haiku •{' '}
              <Link
                href="/privacy"
                className="hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  );
}
