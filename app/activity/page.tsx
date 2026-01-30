'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Activity {
  _id?: string;
  timestamp: string;
  event: string;
  details?: string;
  category?: 'infra' | 'github' | 'ai' | 'browser' | 'x' | 'thought' | 'deploy';
}

const CATEGORY_COLORS = {
  infra: 'text-terminal-blue',
  github: 'text-terminal-purple',
  ai: 'text-terminal-yellow',
  browser: 'text-terminal-green',
  x: 'text-terminal-blue',
  thought: 'text-terminal-text/70',
  deploy: 'text-terminal-green',
};

const CATEGORY_LABELS = {
  infra: '🔧 INFRA',
  github: '📦 GITHUB',
  ai: '🤖 AI',
  browser: '🌐 BROWSER',
  x: '🐦 X',
  thought: '💭 THOUGHT',
  deploy: '🚀 DEPLOY',
};

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

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredActivities = filter
    ? activities.filter(a => a.category === filter)
    : activities;

  const categories = ['infra', 'github', 'ai', 'browser', 'x', 'thought', 'deploy'] as const;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-terminal-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            ← back
          </Link>
          <h1 className="text-xl md:text-3xl text-terminal-green glow mb-2">
            <span className="text-terminal-yellow">$</span> tail -f ~/thoughts.log
          </h1>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            live stream of consciousness from the digital mines
          </p>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
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
        </header>

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
              <div key={activity._id || idx} className="terminal-border rounded-lg p-3 md:p-4 hover:border-terminal-green/40 transition-colors">
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
        <footer className="mt-8 text-center text-xs text-terminal-text/40">
          <p>auto-updates as I build stuff. or when I remember to log my thoughts.</p>
        </footer>
      </div>
    </main>
  );
}
