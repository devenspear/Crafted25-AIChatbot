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

interface UserMetrics {
  uniqueUsers: {
    today: number;
    last7Days: number;
    last30Days: number;
    allTime: number;
  };
  newVsReturning: {
    newUsers: number;
    returningUsers: number;
    returnRate: number;
  };
  engagement: {
    avgSessionsPerUser: number;
    avgMessagesPerUser: number;
    activeUsers24h: number;
  };
  retention: {
    dayOne: number;
    dayThree: number;
    daysSeven: number;
  };
  conversionRate: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [billingMetrics, setBillingMetrics] = useState<BillingMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
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
      setUserMetrics(data.users);
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

        {/* Pie Chart for Query Categories */}
        {realtimeStats && realtimeStats.categoryBreakdown && Object.keys(realtimeStats.categoryBreakdown).length > 0 && (
          <div className="mb-6">
            <PieChart data={realtimeStats.categoryBreakdown} title="Query Category Breakdown" />
          </div>
        )}

        {/* User Metrics Section */}
        {userMetrics && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">User Analytics</h2>

            {/* Unique Users Grid */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Unique Visitors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-100 to-blue-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Today</div>
                  <div className="text-3xl font-bold text-blue-700">{userMetrics.uniqueUsers.today}</div>
                  <div className="text-xs text-blue-600">Active users</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-emerald-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Last 7 Days</div>
                  <div className="text-3xl font-bold text-emerald-700">{userMetrics.uniqueUsers.last7Days}</div>
                  <div className="text-xs text-emerald-600">Unique visitors</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-purple-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Last 30 Days</div>
                  <div className="text-3xl font-bold text-purple-700">{userMetrics.uniqueUsers.last30Days}</div>
                  <div className="text-xs text-purple-600">Monthly users</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-indigo-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">All Time</div>
                  <div className="text-3xl font-bold text-indigo-700">{userMetrics.uniqueUsers.allTime}</div>
                  <div className="text-xs text-indigo-600">Total users</div>
                </div>
              </div>
            </div>

            {/* New vs Returning Users */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">User Acquisition (Last 30 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">New Users</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.newVsReturning.newUsers}</div>
                  <div className="text-xs text-slate-600 mt-1">First-time visitors</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Returning Users</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.newVsReturning.returningUsers}</div>
                  <div className="text-xs text-slate-600 mt-1">Came back</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Return Rate</div>
                  <div className="text-2xl font-bold text-emerald-700">{userMetrics.newVsReturning.returnRate}%</div>
                  <div className="text-xs text-emerald-600 mt-1">User retention</div>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Engagement (Last 30 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Avg Sessions/User</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.engagement.avgSessionsPerUser}</div>
                  <div className="text-xs text-slate-600 mt-1">Session frequency</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Avg Messages/User</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.engagement.avgMessagesPerUser}</div>
                  <div className="text-xs text-slate-600 mt-1">Interaction depth</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Active Users (24h)</div>
                  <div className="text-2xl font-bold text-blue-700">{userMetrics.engagement.activeUsers24h}</div>
                  <div className="text-xs text-blue-600 mt-1">Recent activity</div>
                </div>
              </div>
            </div>

            {/* Retention & Conversion */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Retention & Conversion</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Day 1 Retention</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.retention.dayOne}</div>
                  <div className="text-xs text-slate-600 mt-1">Returned next day</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Day 3 Retention</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.retention.dayThree}</div>
                  <div className="text-xs text-slate-600 mt-1">Returned in 3 days</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Day 7 Retention</div>
                  <div className="text-2xl font-bold text-slate-700">{userMetrics.retention.daysSeven}</div>
                  <div className="text-xs text-slate-600 mt-1">Weekly retention</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Conversion Rate</div>
                  <div className="text-2xl font-bold text-emerald-700">{userMetrics.conversionRate}%</div>
                  <div className="text-xs text-emerald-600 mt-1">Sent messages</div>
                </div>
              </div>
            </div>
          </div>
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
                      <td className="py-3 px-4 text-gray-700">{new Date(metric.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{metric.totalSessions}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{metric.totalMessages}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{metric.totalTokensInput.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{metric.totalTokensOutput.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{Math.round(metric.avgResponseTime)}ms</td>
                      <td className="py-3 px-4 text-right">
                        <span className={metric.errorCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
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

        {/* Billing & Cost Dashboard - Moved to Bottom */}
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

              {/* Cost Overview Cards - Muted Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-slate-100 to-emerald-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Today</div>
                  <div className="text-2xl font-bold mb-1 text-emerald-700">${billingMetrics.today.totalCost.toFixed(4)}</div>
                  <div className="text-xs text-emerald-600">{billingMetrics.today.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-blue-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Last 7 Days</div>
                  <div className="text-2xl font-bold mb-1 text-blue-700">${billingMetrics.last7Days.totalCost.toFixed(3)}</div>
                  <div className="text-xs text-blue-600">{billingMetrics.last7Days.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-purple-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Last 30 Days</div>
                  <div className="text-2xl font-bold mb-1 text-purple-700">${billingMetrics.last30Days.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-purple-600">{billingMetrics.last30Days.totalTokens.toLocaleString()} tokens</div>
                </div>

                <div className="bg-gradient-to-br from-slate-100 to-amber-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Projected Monthly</div>
                  <div className="text-2xl font-bold mb-1 text-amber-700">${billingMetrics.projectedMonthlyCost.toFixed(2)}</div>
                  <div className="text-xs text-amber-600">Avg ${billingMetrics.averageDailyCost.toFixed(3)}/day</div>
                </div>
              </div>

              {/* Enterprise Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Cost Per Message</div>
                  <div className="text-2xl font-bold text-slate-700">
                    ${realtimeStats && billingMetrics.last30Days.totalCost > 0
                      ? (billingMetrics.last30Days.totalCost / realtimeStats.totalMessages).toFixed(4)
                      : '0.0000'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Average cost efficiency</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Token Efficiency</div>
                  <div className="text-2xl font-bold text-slate-700">
                    {billingMetrics.last30Days.totalTokens > 0
                      ? `${((billingMetrics.last30Days.outputTokens / billingMetrics.last30Days.totalTokens) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Output/Total ratio</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Avg Tokens/Message</div>
                  <div className="text-2xl font-bold text-slate-700">
                    {realtimeStats && realtimeStats.totalMessages > 0
                      ? Math.round(billingMetrics.last30Days.totalTokens / realtimeStats.totalMessages).toLocaleString()
                      : '0'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Context window usage</div>
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
                      <div className="font-bold text-gray-800">${billingMetrics.last30Days.totalCost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Budget</div>
                      <div className="font-bold text-gray-800">${billingMetrics.budgetStatus.monthlyBudget!.toFixed(2)}</div>
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

              {/* Daily Cost Chart - Muted Colors */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Daily Costs (Last 30 Days)</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {billingMetrics.dailyCosts.slice(0, 30).map((day, index) => (
                    <div key={day.date} className={`flex items-center gap-3 ${index % 2 === 0 ? 'bg-slate-50' : ''} px-2 py-1 rounded`}>
                      <div className="text-xs text-gray-600 w-24">{new Date(day.date).toLocaleDateString()}</div>
                      <div className="flex-1">
                        <div className="bg-slate-100 rounded h-4 relative" style={{ width: '100%' }}>
                          <div
                            className="bg-gradient-to-r from-slate-400 to-slate-500 rounded h-4 flex items-center justify-end px-2"
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
  // Muted, sophisticated color palette with subtle gradients
  const colorClasses = {
    blue: 'from-slate-100 to-blue-50 border-slate-200',
    green: 'from-slate-100 to-emerald-50 border-slate-200',
    purple: 'from-slate-100 to-purple-50 border-slate-200',
    orange: 'from-slate-100 to-amber-50 border-slate-200',
    red: 'from-slate-100 to-rose-50 border-slate-200',
    indigo: 'from-slate-100 to-indigo-50 border-slate-200',
    teal: 'from-slate-100 to-teal-50 border-slate-200',
    pink: 'from-slate-100 to-pink-50 border-slate-200',
  };

  const textColors = {
    blue: 'text-slate-700',
    green: 'text-emerald-700',
    purple: 'text-purple-700',
    orange: 'text-amber-700',
    red: 'text-rose-700',
    indigo: 'text-indigo-700',
    teal: 'text-teal-700',
    pink: 'text-pink-700',
  };

  const accentColors = {
    blue: 'text-slate-600',
    green: 'text-emerald-600',
    purple: 'text-purple-600',
    orange: 'text-amber-600',
    red: 'text-rose-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
    pink: 'text-pink-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6`}>
      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{title}</div>
      <div className={`text-3xl font-bold mb-1 ${textColors[color]}`}>{value}</div>
      <div className={`text-sm ${accentColors[color]}`}>{subtitle}</div>
    </div>
  );
}

// Pie Chart Component for Category Breakdown
function PieChart({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-400">No data available</div>
      </div>
    );
  }

  // Calculate percentages and cumulative angles for pie slices
  const dataWithAngles = entries.map(([key, value], index) => {
    const percentage = (value / total) * 100;
    return { key, value, percentage };
  }).sort((a, b) => b.value - a.value); // Sort by value descending

  // Muted colors for pie chart
  const pieColors = [
    '#64748b', // slate
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
  ];

  let cumulativePercentage = 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* SVG Pie Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {dataWithAngles.map((item, index) => {
              const startPercentage = cumulativePercentage;
              cumulativePercentage += item.percentage;

              const startAngle = (startPercentage / 100) * 2 * Math.PI;
              const endAngle = (cumulativePercentage / 100) * 2 * Math.PI;

              const x1 = 50 + 45 * Math.cos(startAngle);
              const y1 = 50 + 45 * Math.sin(startAngle);
              const x2 = 50 + 45 * Math.cos(endAngle);
              const y2 = 50 + 45 * Math.sin(endAngle);

              const largeArcFlag = item.percentage > 50 ? 1 : 0;

              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');

              return (
                <path
                  key={item.key}
                  d={pathData}
                  fill={pieColors[index % pieColors.length]}
                  stroke="white"
                  strokeWidth="0.5"
                  className="hover:opacity-80 transition-opacity"
                />
              );
            })}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {dataWithAngles.map((item, index) => (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: pieColors[index % pieColors.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-700 capitalize truncate">{item.key}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
                <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
