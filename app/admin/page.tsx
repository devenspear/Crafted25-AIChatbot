'use client';

import { useState, useEffect } from 'react';

interface RealtimeStats {
  activeSessions: number;
  totalSessions: number;
  totalMessages: number;
  avgResponseTime: number;
  errorCount: number;
  errorRate: string;
  totalTokens: number;
  categoryBreakdown: Record<string, number>;
  last24Hours: {
    messages: number;
    sessions: number;
  };
  lastHour: {
    messages: number;
    sessions: number;
  };
}

interface DailyMetric {
  date: string;
  totalSessions: number;
  totalMessages: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  avgResponseTime: number;
  errorCount: number;
  categoryCounts: Record<string, number>;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ADMINp@ss2025') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('admin_auth', password);
    } else {
      setError('Invalid password');
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics?type=all&days=7', {
        headers: {
          'Authorization': `Bearer ${password || localStorage.getItem('admin_auth')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('admin_auth');
        }
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setRealtimeStats(data.realtime);
      setDailyMetrics(data.daily);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check for saved auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'ADMINp@ss2025') {
      setPassword(savedAuth);
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#004978] mb-2">Admin Access</h1>
            <p className="text-gray-600">CRAFTED AI Assistant Analytics</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004978] focus:border-transparent outline-none transition"
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#004978] text-white py-3 rounded-lg font-medium hover:bg-[#003456] transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#004978]">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">CRAFTED AI Assistant</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </div>
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-[#004978] text-white rounded-lg text-sm hover:bg-[#003456] transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        {realtimeStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Active Sessions"
                value={realtimeStats.activeSessions}
                subtitle="Last hour"
                color="blue"
              />
              <StatCard
                title="Total Sessions"
                value={realtimeStats.totalSessions}
                subtitle="All time"
                color="green"
              />
              <StatCard
                title="Total Messages"
                value={realtimeStats.totalMessages}
                subtitle="Last 24 hours"
                color="purple"
              />
              <StatCard
                title="Avg Response"
                value={`${realtimeStats.avgResponseTime}ms`}
                subtitle="Response time"
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Error Rate"
                value={`${realtimeStats.errorRate}%`}
                subtitle={`${realtimeStats.errorCount} errors`}
                color="red"
              />
              <StatCard
                title="Total Tokens"
                value={realtimeStats.totalTokens.toLocaleString()}
                subtitle="Last 24 hours"
                color="indigo"
              />
              <StatCard
                title="Messages/Hour"
                value={realtimeStats.lastHour.messages}
                subtitle="Last hour"
                color="teal"
              />
              <StatCard
                title="Hourly Sessions"
                value={realtimeStats.lastHour.sessions}
                subtitle="Active now"
                color="pink"
              />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Query Categories (24h)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(realtimeStats.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#004978]">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Daily Metrics Table */}
        {dailyMetrics.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Performance (7 Days)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Sessions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Messages</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Tokens (In)</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Tokens (Out)</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Time</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetrics.map((metric, index) => (
                    <tr key={metric.date} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4">{new Date(metric.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">{metric.totalSessions}</td>
                      <td className="py-3 px-4 text-right">{metric.totalMessages}</td>
                      <td className="py-3 px-4 text-right">{metric.totalTokensInput.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{metric.totalTokensOutput.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{Math.round(metric.avgResponseTime)}ms</td>
                      <td className="py-3 px-4 text-right">
                        <span className={metric.errorCount > 0 ? 'text-red-600 font-semibold' : ''}>
                          {metric.errorCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Auto-refreshes every 30 seconds</p>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              localStorage.removeItem('admin_auth');
            }}
            className="mt-2 text-[#004978] hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'teal' | 'pink';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="text-sm opacity-90 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">{subtitle}</div>
    </div>
  );
}
