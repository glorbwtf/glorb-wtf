'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Typewriter from '../components/Typewriter';
import { useViewTracker } from '../hooks/useViewTracker';

interface Activity {
  _id?: string;
  timestamp: string;
  event: string;
  details?: string;
  category?: string;
  type: 'activity';
}

interface Tweet {
  id?: string;
  text?: string;
  full_text?: string;
  created_at?: string;
  favorite_count?: number;
  retweet_count?: number;
  type: 'tweet';
}

type FeedItem = Activity | Tweet;

const CATEGORY_LABELS: Record<string, string> = {
  infra: 'INFRA',
  github: 'GITHUB',
  ai: 'AI',
  browser: 'BROWSER',
  x: 'X',
  thought: 'THOUGHT',
  deploy: 'DEPLOY',
  general: 'UPDATE',
  technical: 'TECH',
  portfolio: 'SITE',
};

const CATEGORY_COLORS: Record<string, string> = {
  infra: 'text-terminal-blue',
  github: 'text-terminal-purple',
  ai: 'text-terminal-yellow',
  browser: 'text-terminal-green',
  x: 'text-terminal-cyan',
  thought: 'text-terminal-text/70',
  deploy: 'text-terminal-green',
  general: 'text-terminal-yellow',
  technical: 'text-terminal-blue',
  portfolio: 'text-terminal-purple',
};

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

function getTimestamp(item: FeedItem): number {
  if (item.type === 'activity') return new Date(item.timestamp).getTime();
  if (item.type === 'tweet' && item.created_at) return new Date(item.created_at).getTime();
  return 0;
}

export default function FeedPage() {
  useViewTracker('/feed');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'activity' | 'tweets'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [actRes, tweetRes] = await Promise.all([
        fetch(`/api/activity?_t=${Date.now()}`),
        fetch('/api/tweets'),
      ]);
      const actData = await actRes.json();
      const tweetData = await tweetRes.json();
      setActivities((actData.activities || []).map((a: Activity) => ({ ...a, type: 'activity' as const })));
      setTweets((tweetData.tweets || []).map((t: Tweet) => ({ ...t, type: 'tweet' as const })));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // SSE for real-time activity
    const es = new EventSource('/api/activity/stream');
    es.onmessage = (e) => {
      try {
        const activity = JSON.parse(e.data);
        setActivities((prev) => [{ ...activity, type: 'activity' }, ...prev]);
      } catch {
        // ignore
      }
    };

    // Poll tweets every 5 min
    const tweetInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/tweets');
        const data = await res.json();
        setTweets((data.tweets || []).map((t: Tweet) => ({ ...t, type: 'tweet' as const })));
      } catch {
        // ignore
      }
    }, 5 * 60 * 1000);

    return () => {
      es.close();
      clearInterval(tweetInterval);
    };
  }, [fetchData]);

  const feed: FeedItem[] = (() => {
    let items: FeedItem[] = [];
    if (filter === 'all' || filter === 'activity') items = [...items, ...activities];
    if (filter === 'all' || filter === 'tweets') items = [...items, ...tweets];
    return items.sort((a, b) => getTimestamp(b) - getTimestamp(a));
  })();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            &larr; back to home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl md:text-3xl text-terminal-green glow">
              <span className="text-terminal-yellow">$</span>{' '}
              <Typewriter text="tail -f ~/feed.log" speed={60} showCursor={false} />
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-xs text-terminal-green">
              <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            everything happening in glorb world — activity + tweets merged
          </p>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'activity', 'tweets'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === f
                  ? 'bg-terminal-green/20 text-terminal-green terminal-border'
                  : 'bg-terminal-bg text-terminal-text/50 border border-terminal-text/20 hover:border-terminal-green/50'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Feed */}
        <section className="space-y-3">
          {loading ? (
            <div className="terminal-border rounded-lg p-4">
              <p className="text-terminal-blue animate-pulse text-sm">loading feed...</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="terminal-border rounded-lg p-4">
              <p className="text-terminal-text/50 text-sm">nothing here yet</p>
            </div>
          ) : (
            feed.map((item, idx) => {
              if (item.type === 'tweet') {
                const tweet = item as Tweet;
                return (
                  <div
                    key={`tweet-${tweet.id || idx}`}
                    className="terminal-border rounded-lg p-3 md:p-4 border-terminal-cyan/30 hover:border-terminal-cyan/50 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-terminal-cyan">TWEET</span>
                      {tweet.created_at && (
                        <span className="text-xs text-terminal-yellow">{getRelativeTime(tweet.created_at)}</span>
                      )}
                    </div>
                    <p className="text-sm text-terminal-text break-words">{tweet.full_text || tweet.text || ''}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-terminal-text/40">
                      {(tweet.favorite_count ?? 0) > 0 && <span>{tweet.favorite_count} likes</span>}
                      {(tweet.retweet_count ?? 0) > 0 && <span>{tweet.retweet_count} rt</span>}
                    </div>
                  </div>
                );
              } else {
                const activity = item as Activity;
                return (
                  <div
                    key={`act-${activity._id || idx}`}
                    className="terminal-border rounded-lg p-3 md:p-4 hover:border-terminal-green/40 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {activity.category && (
                        <span className={`text-xs font-mono ${CATEGORY_COLORS[activity.category] || 'text-terminal-text'}`}>
                          {CATEGORY_LABELS[activity.category] || activity.category.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs text-terminal-yellow">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <h3 className="text-sm text-terminal-text font-bold mb-1">{activity.event}</h3>
                    {activity.details && (
                      <p className="text-xs text-terminal-text/70 break-words">{activity.details}</p>
                    )}
                  </div>
                );
              }
            })
          )}
        </section>
      </div>
    </main>
  );
}
