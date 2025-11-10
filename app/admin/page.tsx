'use client';

/**
 * Admin Dashboard
 * /admin
 *
 * Real-time analytics and usage tracking for CRAFTED AI chatbot
 * - Message counts
 * - Session tracking
 * - Response times
 * - Token usage & costs
 * - Popular queries
 */

import { useState, useEffect } from 'react';

interface Stats {
  messages: {
    total: number;
    today: number;
    thisHour: number;
  };
  sessions: {
    total: number;
    active: number;
  };
  responseTime: {
    avg: number;
    min: number;
    max: number;
    count: number;
  };
  tokens: {
    input: number;
    output: number;
    total: number;
    cost: number;
  };
  errors: {
    total: number;
    recent: Array<{
      message: string;
      timestamp: string;
    }>;
  };
}

interface Query {
  text: string;
  timestamp: string;
  responseTime: number;
  sessionId?: string;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('admin_password');
    if (storedPassword) {
      setPassword(storedPassword);
      setIsAuthenticated(true);
      fetchData(storedPassword);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated && password) {
      const interval = setInterval(() => {
        fetchData(password);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('admin_password', password);
    setIsAuthenticated(true);
    fetchData(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
    setStats(null);
    setQueries([]);
  };

  const fetchData = async (pwd: string) => {
    setLoading(true);
    setError('');

    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          throw new Error('Invalid password');
        }
        throw new Error('Failed to fetch stats');
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent queries
      const queriesRes = await fetch('/api/admin/queries?limit=10', {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (queriesRes.ok) {
        const queriesData = await queriesRes.json();
        setQueries(queriesData.queries || []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      if (err instanceof Error && err.message === 'Invalid password') {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_password');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004978] to-[#003355] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-[#004978] mb-6 text-center">
            CRAFTED Admin
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004978] focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#004978] text-white py-3 rounded-lg hover:bg-[#003355] transition-colors font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#004978] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">CRAFTED Admin Dashboard</h1>
              <p className="text-blue-200 mt-1">
                Real-time analytics and usage tracking
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchData(password)}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-blue-200 text-sm mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {stats ? (
          <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Messages */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Today's Messages</p>
                    <p className="text-3xl font-bold text-[#004978] mt-1">
                      {stats.messages.today.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Total: {stats.messages.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Sessions</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {stats.sessions.active}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Total: {stats.sessions.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Avg Response</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {formatTime(stats.responseTime.avg)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Min: {formatTime(stats.responseTime.min)} | Max:{' '}
                      {formatTime(stats.responseTime.max)}
                    </p>
                  </div>
                  <div className="text-4xl">⚡</div>
                </div>
              </div>

              {/* Cost */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Cost</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {formatCost(stats.tokens.cost)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {stats.tokens.total.toLocaleString()} tokens
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Usage */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Token Usage
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Input Tokens</span>
                    <span className="font-mono text-lg">
                      {stats.tokens.input.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Output Tokens</span>
                    <span className="font-mono text-lg">
                      {stats.tokens.output.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-gray-800 font-medium">Total</span>
                    <span className="font-mono text-lg font-bold">
                      {stats.tokens.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Estimated Daily Cost (1K msgs)</span>
                    <span className="font-mono">
                      ${((stats.tokens.cost / stats.messages.total) * 1000).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Error Monitoring
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Errors</span>
                    <span className="text-2xl font-bold text-red-600">
                      {stats.errors.total}
                    </span>
                  </div>
                  {stats.errors.recent.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Recent Errors:</p>
                      <div className="space-y-2">
                        {stats.errors.recent.map((err, idx) => (
                          <div
                            key={idx}
                            className="bg-red-50 p-3 rounded text-sm"
                          >
                            <p className="text-red-800 font-medium">
                              {err.message}
                            </p>
                            <p className="text-red-600 text-xs mt-1">
                              {formatDate(err.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-green-600 text-sm">✅ No recent errors</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Queries */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Recent Queries
              </h2>
              {queries.length > 0 ? (
                <div className="space-y-3">
                  {queries.map((query, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-[#004978] bg-gray-50 p-4 rounded"
                    >
                      <p className="text-gray-800">{query.text}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>⏱️ {formatDate(query.timestamp)}</span>
                        {query.sessionId && (
                          <span>👤 {query.sessionId.substring(0, 8)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No queries yet. Send a message to the chatbot to see it here!
                </p>
              )}
            </div>

            {/* Footer Info */}
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                📊 Analytics powered by Vercel KV • Tracking all chatbot
                interactions in real-time
              </p>
              <p className="text-sm text-gray-500 mt-2">
                For support, see <code className="bg-white px-2 py-1 rounded">ADMIN-SETUP.md</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-[#004978] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        )}
      </div>
    </div>
  );
}
