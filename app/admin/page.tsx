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

interface BillingMetrics {
  today: CostBreakdown;
  yesterday: CostBreakdown;
  last7Days: CostBreakdown;
  last30Days: CostBreakdown;
  dailyCosts: Array<{ date: string; cost: number; tokens: number }>;
  averageDailyCost: number;
  projectedMonthlyCost: number;
  budgetStatus?: {
    monthlyBudget?: number;
    percentUsed?: number;
    daysRemaining?: number;
    projectedOverage?: number;
  };
}

interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [billingMetrics, setBillingMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(50); // Default $50/month budget

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, monthlyBudget]);

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
      const response = await fetch(`/api/admin/analytics?type=all&days=7&budget=${monthlyBudget}`, {
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
      setBillingMetrics(data.billing);
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

        {/* Billing & Cost Dashboard */}
        {billingMetrics && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">API Usage & Billing</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Monthly Budget:</label>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    step="10"
                  />
                  <span className="text-sm text-gray-600">USD</span>
                </div>
              </div>

              {/* Cost Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                  <div className="text-xs opacity-90 mb-1">Today</div>
                  <div className="text-2xl font-bold mb-1">${billingMetrics.today.totalCost.toFixed(4)}</div>
                  <div className="text-xs opacity-75">{billingMetrics.today.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="text-xs opacity-90 mb-1">Last 7 Days</div>
                  <div className="text-2xl font-bold mb-1">${billingMetrics.last7Days.totalCost.toFixed(3)}</div>
                  <div className="text-xs opacity-75">{billingMetrics.last7Days.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="text-xs opacity-90 mb-1">Last 30 Days</div>
                  <div className="text-2xl font-bold mb-1">${billingMetrics.last30Days.totalCost.toFixed(2)}</div>
                  <div className="text-xs opacity-75">{billingMetrics.last30Days.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                  <div className="text-xs opacity-90 mb-1">Projected Monthly</div>
                  <div className="text-2xl font-bold mb-1">${billingMetrics.projectedMonthlyCost.toFixed(2)}</div>
                  <div className="text-xs opacity-75">Avg ${billingMetrics.averageDailyCost.toFixed(3)}/day</div>
                </div>
              </div>

              {/* Budget Status */}
              {billingMetrics.budgetStatus && (
                <div className={`rounded-xl p-4 mb-6 ${
                  billingMetrics.budgetStatus.percentUsed! > 100
                    ? 'bg-red-50 border-2 border-red-300'
                    : billingMetrics.budgetStatus.percentUsed! > 80
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-green-50 border-2 border-green-300'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">Budget Status</h3>
                    <span className={`text-lg font-bold ${
                      billingMetrics.budgetStatus.percentUsed! > 100
                        ? 'text-red-600'
                        : billingMetrics.budgetStatus.percentUsed! > 80
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {billingMetrics.budgetStatus.percentUsed!.toFixed(1)}% Used
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        billingMetrics.budgetStatus.percentUsed! > 100
                          ? 'bg-red-500'
                          : billingMetrics.budgetStatus.percentUsed! > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(billingMetrics.budgetStatus.percentUsed!, 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Current Spend</div>
                      <div className="font-bold">${billingMetrics.last30Days.totalCost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Budget</div>
                      <div className="font-bold">${billingMetrics.budgetStatus.monthlyBudget!.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Projected Overage</div>
                      <div className={`font-bold ${billingMetrics.budgetStatus.projectedOverage! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${billingMetrics.budgetStatus.projectedOverage!.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Cost Chart */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Daily Costs (Last 30 Days)</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {billingMetrics.dailyCosts.slice(0, 30).map((day, index) => (
                    <div key={day.date} className={`flex items-center gap-3 ${index % 2 === 0 ? 'bg-gray-50' : ''} px-2 py-1 rounded`}>
                      <div className="text-xs text-gray-600 w-24">{new Date(day.date).toLocaleDateString()}</div>
                      <div className="flex-1">
                        <div className="bg-blue-100 rounded h-4 relative" style={{ width: '100%' }}>
                          <div
                            className="bg-blue-500 rounded h-4 flex items-center justify-end px-2"
                            style={{
                              width: `${Math.max((day.cost / Math.max(...billingMetrics.dailyCosts.map(d => d.cost))) * 100, 2)}%`
                            }}
                          >
                            <span className="text-xs text-white font-semibold">${day.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 w-20 text-right">{day.tokens.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

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
