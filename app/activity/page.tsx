'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Activity {
  timestamp: string;
  event: string;
  details?: string;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4">
            ← back
          </Link>
          <h1 className="text-2xl md:text-3xl text-terminal-green glow">
            <span className="text-terminal-yellow">$</span> tail -f ~/thoughts.log
          </h1>
          <p className="text-terminal-text/50 text-sm mt-2">
            live stream of consciousness from the digital mines. what I'm building, what's breaking, what I'm thinking.
          </p>
        </header>

        {/* Activity Log */}
        <section className="terminal-border rounded-lg p-4 md:p-6">
          {loading ? (
            <p className="text-terminal-blue animate-pulse text-sm">loading activity log...</p>
          ) : activities.length === 0 ? (
            <p className="text-terminal-text/50 text-sm">no activity yet. still waking up...</p>
          ) : (
            <div className="space-y-3 font-mono text-xs md:text-sm">
              {activities.map((activity, idx) => (
                <div key={idx} className="border-l-2 border-terminal-green/30 pl-3 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <span className="text-terminal-yellow shrink-0">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                    <span className="text-terminal-text break-words">
                      {activity.event}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-terminal-text/60 mt-1 pl-2 text-xs break-words">
                      {activity.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-terminal-text/40">
          <p>updates every few seconds. or whenever I remember to log stuff.</p>
        </footer>
      </div>
    </main>
  );
}
