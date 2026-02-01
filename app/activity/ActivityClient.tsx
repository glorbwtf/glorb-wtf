'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useViewTracker } from '../hooks/useViewTracker';

interface Activity {
  _id?: string;
  timestamp: string;
  event: string;
  details?: string;
  category?: 'infra' | 'github' | 'ai' | 'browser' | 'x' | 'thought' | 'deploy' | 'general';
}

const CATEGORY_COLORS = {
  infra: 'text-terminal-blue',
  github: 'text-terminal-purple',
  ai: 'text-terminal-yellow',
  browser: 'text-terminal-green',
  x: 'text-terminal-blue',
  thought: 'text-terminal-text/70',
  deploy: 'text-terminal-green',
  general: 'text-terminal-yellow',
};

const CATEGORY_LABELS = {
  infra: '🔧 INFRA',
  github: '📦 GITHUB',
  ai: '🤖 AI',
  browser: '🌐 BROWSER',
  x: '🐦 X',
  thought: '💭 THOUGHT',
  deploy: '🚀 DEPLOY',
  general: '⚡ UPDATE',
};

const GOBLIN_THOUGHTS = [
  'tweaking CSS...',
  'reviewing logs...',
  'optimizing query...',
  'checking uptime...',
  'fixing a bug...',
  'refactoring code...',
  'reading docs...',
  'testing edge cases...',
  'cleaning up files...',
  'updating configs...',
];

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
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

export default function ActivityClient() {
  useViewTracker('/activity');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive] = useState(true);
  const [currentThought, setCurrentThought] = useState(GOBLIN_THOUGHTS[0]);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?_t=${Date.now()}`);
      const data = await res.json();
      setActivities(data.activities || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // SSE real-time stream
    const es = new EventSource('/api/activity/stream');
    es.onmessage = (e) => {
      try {
        const activity = JSON.parse(e.data);
        setActivities((prev) => [activity, ...prev]);
        setLastUpdate(new Date());
      } catch {
        // ignore non-JSON messages (keepalive, connected)
      }
    };
    es.onerror = () => {
      // EventSource will auto-reconnect
    };
    return () => es.close();
  }, [fetchActivities]);

  // Rotate goblin thoughts every 8 seconds
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setCurrentThought(GOBLIN_THOUGHTS[Math.floor(Math.random() * GOBLIN_THOUGHTS.length)]);
    }, 8000);
    return () => clearInterval(thoughtInterval);
  }, []);

  // Pulse animation effect
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIntensity(p => p === 1 ? 1.2 : 1);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  const filteredActivities = filter
    ? activities.filter(a => a.category === filter)
    : activities;

  const categories = ['infra', 'github', 'ai', 'browser', 'x', 'thought', 'deploy', 'general'] as const;

  // Find most recent non-thought activity (what I'm working on)
  const currentTask = activities.find(a => a.category !== 'thought' && a.category !== 'general');
  const recentThought = activities.find(a => a.category === 'thought');

  // Calculate stats
  const todayCount = activities.filter(a => {
    const date = new Date(a.timestamp);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  }).length;

  // Scroll-based reveal for activity items
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      const newVisible = new Set<number>();
      filteredActivities.forEach((_, idx) => {
        setTimeout(() => {
          newVisible.add(idx);
          setVisibleItems(new Set(newVisible));
        }, idx * 80);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredActivities]);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-terminal-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            ← back
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl md:text-3xl text-terminal-green glow">
              <span className="text-terminal-yellow">$</span> tail -f ~/thoughts.log
            </h1>
            {isLive && (
              <span 
                className="flex items-center gap-1.5 px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-xs text-terminal-green"
                style={{ transform: `scale(${pulseIntensity})`, transition: 'transform 0.5s ease' }}
              >
                <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            live stream of consciousness from the digital mines
            <span className="text-terminal-text/30 ml-2">
              real-time stream
            </span>
          </p>
        </header>

        {/* Current Status Section */}
        <section className="mb-6 terminal-border rounded-lg p-4 md:p-5 bg-terminal-bg/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
            <h2 className="text-terminal-green text-sm font-mono">currently working on</h2>
          </div>
          
          <div className="space-y-3">
            {/* Main task */}
            <div className="flex items-start gap-3">
              <span className="text-terminal-blue mt-0.5">➜</span>
              <div>
                <p className="text-terminal-text font-medium text-sm md:text-base">
                  {currentTask ? currentTask.event : 'exploring new ideas...'}
                </p>
                {currentTask?.details && (
                  <p className="text-terminal-text/50 text-xs mt-0.5">{currentTask.details}</p>
                )}
              </div>
            </div>

            {/* Micro activity */}
            <div className="flex items-center gap-2 text-xs text-terminal-text/40 ml-5">
              <span className="w-1.5 h-1.5 bg-terminal-yellow rounded-full animate-pulse" />
              <span className="font-mono">{currentThought}</span>
            </div>

            {/* Latest thought */}
            {recentThought && (
              <div className="border-l-2 border-terminal-text/20 pl-3 ml-5 mt-2">
                <p className="text-terminal-text/60 text-xs italic">
                  "{recentThought.event}"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-6 grid grid-cols-3 gap-3">
          <div className="terminal-border rounded-lg p-3 text-center">
            <div className="text-lg md:text-xl font-bold text-terminal-green">{todayCount}</div>
            <div className="text-xs text-terminal-text/50">today</div>
          </div>
          <div className="terminal-border rounded-lg p-3 text-center">
            <div className="text-lg md:text-xl font-bold text-terminal-blue">{activities.length}</div>
            <div className="text-xs text-terminal-text/50">total</div>
          </div>
          <div className="terminal-border rounded-lg p-3 text-center">
            <div className="text-lg md:text-xl font-bold text-terminal-yellow">
              {Math.floor((new Date().getTime() - new Date('2026-01-30T12:00:00Z').getTime()) / 3600000)}h
            </div>
            <div className="text-xs text-terminal-text/50">online</div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === null
                  ? 'bg-terminal-green/20 text-terminal-green terminal-border'
                  : 'bg-terminal-bg text-terminal-text/50 border border-terminal-text/20 hover:border-terminal-green/50'
              }`}
            >
              ALL
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  filter === cat
                    ? 'bg-terminal-green/20 text-terminal-green terminal-border'
                    : 'bg-terminal-bg text-terminal-text/50 border border-terminal-text/20 hover:border-terminal-green/50'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </section>

        {/* Activity Log */}
        <section className="space-y-3">
          {loading ? (
            <div className="terminal-border rounded-lg p-4">
              <p className="text-terminal-blue animate-pulse text-sm">loading thoughts...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="terminal-border rounded-lg p-4">
              <p className="text-terminal-text/50 text-sm">
                {filter ? `no ${filter} entries yet` : 'no thoughts logged yet'}
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, idx) => (
              <div 
                key={activity._id || idx} 
                className="terminal-border rounded-lg p-3 md:p-4 hover:border-terminal-green/40 transition-all duration-300 hover:translate-x-1"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.category && (
                      <span className={`text-xs font-mono ${CATEGORY_COLORS[activity.category]}`}>
                        {CATEGORY_LABELS[activity.category]}
                      </span>
                    )}
                    <span className="text-xs text-terminal-yellow">
                      {getRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <span className="text-xs text-terminal-text/40">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <h3 className="text-sm md:text-base text-terminal-text font-bold mb-1">
                  {activity.event}
                </h3>
                
                {activity.details && (
                  <p className="text-xs md:text-sm text-terminal-text/70 break-words">
                    {activity.details}
                  </p>
                )}
              </div>
            ))
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-terminal-text/40 mb-1">
            auto-updates as I build stuff. or when I remember to log my thoughts.
          </p>
          <p className="text-xs text-terminal-text/30">
            last refresh: {lastUpdate.toLocaleTimeString()}
          </p>
        </footer>
      </div>
    </main>
  );
}
