'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useViewTracker } from '../hooks/useViewTracker';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PageView {
  page: string;
  count: number;
  lastView: string;
}

interface TrendData {
  hourly: Array<{ time: string; count: number }>;
  daily: Array<{ date: string; count: number }>;
  topPages30d: Array<{ page: string; count: number }>;
  realtime: { last5m: number };
  geography?: Array<{ country: string; count: number }>;
  timeHeatmap?: Array<{ hour: number; count: number }>;
  sessions?: {
    total: number;
    bounceRate: number;
    avgDuration: number;
  };
  referrers?: Array<{ source: string; count: number; category: string }>;
  referrersByCategory?: Array<{ category: string; count: number }>;
}

interface ViewData {
  total: number;
  pages: PageView[];
  trends?: TrendData;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function formatHour(hourStr: string): string {
  const date = new Date(hourStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Map country codes to names (top countries only for display)
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  IN: 'India',
  BR: 'Brazil',
  JP: 'Japan',
  CN: 'China',
  RU: 'Russia',
  ES: 'Spain',
  IT: 'Italy',
  MX: 'Mexico',
  KR: 'South Korea',
  SE: 'Sweden',
  PL: 'Poland',
  SG: 'Singapore',
  XX: 'Unknown',
};

function getCountryName(code: string): string {
  return countryNames[code] || code;
}

export default function AnalyticsPage() {
  useViewTracker('/analytics');

  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/views?trends=true');
        const data = await res.json();
        setViewData(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
    const interval = setInterval(fetchViews, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-terminal-bg text-terminal-text p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="terminal-border rounded p-6">
            <div className="text-terminal-green glow">Loading analytics...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!viewData) {
    return (
      <main className="min-h-screen bg-terminal-bg text-terminal-text p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="terminal-border rounded p-6">
            <div className="text-terminal-red glow">Failed to load analytics</div>
          </div>
        </div>
      </main>
    );
  }

  const maxCount = Math.max(...viewData.pages.map(p => p.count));

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="terminal-border rounded p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-terminal-green glow mb-2">
                {'>'} Analytics Dashboard
              </h1>
              <p className="text-terminal-text/70">
                Traffic trends and real-time insights
              </p>
            </div>
            <Link
              href="/"
              className="text-terminal-cyan hover:text-terminal-green transition-colors glow text-sm sm:text-base"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="terminal-border rounded p-6">
            <div className="text-terminal-text/60 text-xs mb-2">TOTAL VIEWS</div>
            <div className="text-3xl sm:text-4xl font-bold text-terminal-green glow">
              {viewData.total}
            </div>
            <div className="text-terminal-text/50 text-xs mt-2">
              All time
            </div>
          </div>

          <div className="terminal-border rounded p-6">
            <div className="text-terminal-text/60 text-xs mb-2">UNIQUE PAGES</div>
            <div className="text-3xl sm:text-4xl font-bold text-terminal-cyan glow">
              {viewData.pages.length}
            </div>
            <div className="text-terminal-text/50 text-xs mt-2">
              Pages tracked
            </div>
          </div>

          <div className="terminal-border rounded p-6">
            <div className="text-terminal-text/60 text-xs mb-2">REAL-TIME</div>
            <div className="text-3xl sm:text-4xl font-bold text-terminal-yellow glow">
              {viewData.trends?.realtime.last5m || 0}
            </div>
            <div className="text-terminal-text/50 text-xs mt-2">
              Last 5 minutes
            </div>
          </div>

          <div className="terminal-border rounded p-6">
            <div className="text-terminal-text/60 text-xs mb-2">BOUNCE RATE</div>
            <div className="text-3xl sm:text-4xl font-bold text-terminal-red glow">
              {viewData.trends?.sessions?.bounceRate || 0}%
            </div>
            <div className="text-terminal-text/50 text-xs mt-2">
              Single-page visits
            </div>
          </div>
        </div>

        {/* Session Metrics */}
        {viewData.trends?.sessions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="terminal-border rounded p-6">
              <h3 className="text-lg font-bold text-terminal-cyan glow mb-4">
                Session Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-terminal-text/60 text-xs mb-1">Total Sessions (30d)</div>
                  <div className="text-2xl font-bold text-terminal-green glow">
                    {viewData.trends.sessions.total}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-text/60 text-xs mb-1">Avg Duration</div>
                  <div className="text-2xl font-bold text-terminal-yellow glow">
                    {formatDuration(viewData.trends.sessions.avgDuration)}
                  </div>
                </div>
              </div>
            </div>

            <div className="terminal-border rounded p-6">
              <h3 className="text-lg font-bold text-terminal-cyan glow mb-4">
                Top Countries
              </h3>
              <div className="space-y-2">
                {viewData.trends.geography?.slice(0, 5).map((geo, idx) => (
                  <div key={geo.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-terminal-text/60 text-xs w-4">#{idx + 1}</div>
                      <div className="text-terminal-green">
                        {getCountryName(geo.country)}
                      </div>
                    </div>
                    <div className="text-terminal-yellow font-bold">
                      {geo.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hourly Trend Chart */}
        {viewData.trends && viewData.trends.hourly.length > 0 && (
          <div className="terminal-border rounded p-6">
            <h2 className="text-xl font-bold text-terminal-cyan glow mb-4">
              Last 24 Hours
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={viewData.trends.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 0, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#00ff00"
                  tickFormatter={formatHour}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#00ff00"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    color: '#00ff00'
                  }}
                  labelFormatter={(label) => formatHour(String(label))}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00ff00" 
                  strokeWidth={2}
                  dot={{ fill: '#00ff00', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily Trend Chart */}
        {viewData.trends && viewData.trends.daily.length > 0 && (
          <div className="terminal-border rounded p-6">
            <h2 className="text-xl font-bold text-terminal-cyan glow mb-4">
              Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={viewData.trends.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 0, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#00ff00"
                  tickFormatter={formatDate}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#00ff00"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    color: '#00ff00'
                  }}
                  labelFormatter={(label) => formatDate(String(label))}
                />
                <Bar 
                  dataKey="count" 
                  fill="#00ff00" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Timezone Heatmap */}
        {viewData.trends && viewData.trends.timeHeatmap && viewData.trends.timeHeatmap.length > 0 && (
          <div className="terminal-border rounded p-6">
            <h2 className="text-xl font-bold text-terminal-cyan glow mb-4">
              Activity by Hour (UTC)
            </h2>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const data = viewData.trends?.timeHeatmap?.find(t => t.hour === hour);
                const count = data?.count || 0;
                const maxCount = Math.max(...(viewData.trends?.timeHeatmap?.map(t => t.count) || [1]));
                const intensity = count > 0 ? (count / maxCount) : 0;
                
                return (
                  <div
                    key={hour}
                    className="aspect-square relative group cursor-pointer"
                    title={`${hour}:00 - ${count} views`}
                  >
                    <div
                      className="w-full h-full rounded transition-all duration-300 hover:scale-110"
                      style={{
                        backgroundColor: `rgba(0, 255, 0, ${intensity * 0.8})`,
                        border: intensity > 0 ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(100, 100, 100, 0.2)',
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-terminal-bg border border-terminal-green rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                      <div className="text-terminal-green glow">{hour}:00</div>
                      <div className="text-terminal-yellow">{count} views</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-terminal-text/60">
              <div>00:00</div>
              <div>Peak Activity Hours</div>
              <div>23:00</div>
            </div>
          </div>
        )}

        {/* Referrer Analytics */}
        {viewData.trends && viewData.trends.referrers && viewData.trends.referrers.length > 0 && (
          <div className="terminal-border rounded p-6">
            <h2 className="text-xl font-bold text-terminal-cyan glow mb-4">
              Traffic Sources
            </h2>
            
            {/* Mobile: Cards */}
            <div className="sm:hidden space-y-3">
              {viewData.trends.referrers.map((ref, idx) => (
                <div
                  key={ref.source}
                  className="terminal-border rounded p-4 bg-terminal-bg/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-terminal-text/60 text-xs">#{idx + 1}</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        ref.category === 'social' ? 'bg-terminal-cyan/20 text-terminal-cyan' :
                        ref.category === 'search' ? 'bg-terminal-yellow/20 text-terminal-yellow' :
                        ref.category === 'direct' ? 'bg-terminal-green/20 text-terminal-green' :
                        'bg-terminal-text/20 text-terminal-text/60'
                      }`}>
                        {ref.category}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-terminal-yellow glow">
                      {ref.count}
                    </div>
                  </div>
                  <div className="font-mono text-terminal-green glow text-sm mb-2 break-all">
                    {ref.source}
                  </div>
                  <div className="h-2 bg-terminal-bg rounded overflow-hidden">
                    <div
                      className="h-full bg-terminal-green glow transition-all duration-500"
                      style={{ 
                        width: `${(ref.count / (viewData.trends?.referrers?.[0]?.count || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-terminal-green/30">
                    <th className="text-left py-3 px-2 text-terminal-green glow">#</th>
                    <th className="text-left py-3 px-2 text-terminal-green glow">Source</th>
                    <th className="text-left py-3 px-2 text-terminal-green glow">Type</th>
                    <th className="text-right py-3 px-2 text-terminal-green glow">Views</th>
                    <th className="text-left py-3 px-2 text-terminal-green glow">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {viewData.trends.referrers.map((ref, idx) => (
                    <tr
                      key={ref.source}
                      className="border-b border-terminal-text/10 hover:bg-terminal-green/5 transition-colors"
                    >
                      <td className="py-3 px-2 text-terminal-text/60">{idx + 1}</td>
                      <td className="py-3 px-2 text-terminal-cyan">{ref.source}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          ref.category === 'social' ? 'bg-terminal-cyan/20 text-terminal-cyan' :
                          ref.category === 'search' ? 'bg-terminal-yellow/20 text-terminal-yellow' :
                          ref.category === 'direct' ? 'bg-terminal-green/20 text-terminal-green' :
                          'bg-terminal-text/20 text-terminal-text/60'
                        }`}>
                          {ref.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-terminal-yellow glow font-bold">
                        {ref.count}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-terminal-bg rounded overflow-hidden max-w-xs">
                            <div
                              className="h-full bg-terminal-green glow transition-all duration-500"
                              style={{ 
                                width: `${(ref.count / (viewData.trends?.referrers?.[0]?.count || 1)) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-terminal-text/50 whitespace-nowrap">
                            {Math.round((ref.count / viewData.total) * 100)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Category breakdown */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {viewData.trends.referrersByCategory?.map(cat => (
                <div key={cat.category} className="terminal-border rounded p-4">
                  <div className="text-terminal-text/60 text-xs mb-1 uppercase">
                    {cat.category}
                  </div>
                  <div className="text-2xl font-bold text-terminal-green glow">
                    {cat.count}
                  </div>
                  <div className="text-xs text-terminal-text/50 mt-1">
                    {Math.round((cat.count / viewData.total) * 100)}% of traffic
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Pages */}
        <div className="terminal-border rounded p-6">
          <h2 className="text-xl font-bold text-terminal-cyan glow mb-4">
            Top Pages (All Time)
          </h2>
          
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-4">
            {viewData.pages.slice(0, 10).map((page, idx) => (
              <div
                key={page.page}
                className="terminal-border rounded p-4 bg-terminal-bg/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-terminal-green glow">
                    #{idx + 1}
                  </div>
                  <div className="text-2xl font-bold text-terminal-yellow glow">
                    {page.count}
                  </div>
                </div>
                <div className="font-mono text-terminal-text mb-2 break-all">
                  {page.page}
                </div>
                <div className="text-xs text-terminal-text/60">
                  Last: {getRelativeTime(page.lastView)}
                </div>
                {/* Bar */}
                <div className="mt-3 h-2 bg-terminal-bg rounded overflow-hidden">
                  <div
                    className="h-full bg-terminal-green glow transition-all duration-500"
                    style={{ width: `${(page.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-terminal-green/30">
                  <th className="text-left py-3 px-2 text-terminal-green glow">#</th>
                  <th className="text-left py-3 px-2 text-terminal-green glow">Page</th>
                  <th className="text-right py-3 px-2 text-terminal-green glow">Views</th>
                  <th className="text-left py-3 px-2 text-terminal-green glow">Visual</th>
                  <th className="text-right py-3 px-2 text-terminal-green glow">Last Viewed</th>
                </tr>
              </thead>
              <tbody>
                {viewData.pages.slice(0, 10).map((page, idx) => (
                  <tr
                    key={page.page}
                    className="border-b border-terminal-text/10 hover:bg-terminal-green/5 transition-colors"
                  >
                    <td className="py-3 px-2 text-terminal-text/60">{idx + 1}</td>
                    <td className="py-3 px-2 text-terminal-cyan">{page.page}</td>
                    <td className="py-3 px-2 text-right text-terminal-yellow glow font-bold">
                      {page.count}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-terminal-bg rounded overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-terminal-green glow transition-all duration-500"
                            style={{ width: `${(page.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-terminal-text/50 whitespace-nowrap">
                          {Math.round((page.count / viewData.total) * 100)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-terminal-text/60 text-xs">
                      {getRelativeTime(page.lastView)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-terminal-text/40 text-xs">
          Updates every 30 seconds • Real-time data powered by MongoDB
        </div>
      </div>
    </main>
  );
}
