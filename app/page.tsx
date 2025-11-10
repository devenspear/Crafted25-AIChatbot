'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: userMessage }]
    });
  };

  const suggestedQuestions = [
    { emoji: '📅', title: 'Saturday Schedule', question: 'What events are happening on Saturday?' },
    { emoji: '🍺', title: 'Firkin Fête', question: 'Tell me about the Firkin Fête' },
    { emoji: '✨', title: 'Workshops', question: 'What workshops are available?' },
    { emoji: '🗓️', title: 'Full Schedule', question: 'Show me the full event schedule' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Crafted 2025</h1>
        <p className="text-orange-100 mt-1">Your Event Assistant • November 12-16 • Alys Beach, Florida</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-12 px-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to Crafted 2025! 🎨
            </h2>
            <p className="text-gray-600 mb-6">
              Ask me anything about the event schedule, experiences, or activities!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {suggestedQuestions.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(sq.question)}
                  className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <p className="font-medium text-gray-800">{sq.emoji} {sq.title}</p>
                  <p className="text-sm text-gray-600">{sq.question}</p>
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
              className={`max-w-[85%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-800 shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.parts.map((part, idx) => {
                  if (part.type === 'text') {
                    return <span key={idx}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Crafted 2025 events..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
