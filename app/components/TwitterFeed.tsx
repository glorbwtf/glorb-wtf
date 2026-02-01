'use client';

import { useState, useEffect } from 'react';

interface Tweet {
  id?: string;
  text?: string;
  full_text?: string;
  created_at?: string;
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  user?: {
    screen_name?: string;
  };
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

export default function TwitterFeed({ limit = 5 }: { limit?: number }) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const res = await fetch('/api/tweets');
        const data = await res.json();
        setTweets((data.tweets || []).slice(0, limit));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
    const interval = setInterval(fetchTweets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit]);

  if (loading) {
    return (
      <div className="text-terminal-text/50 text-sm animate-pulse">
        loading tweets...
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="text-terminal-text/50 text-sm">
        no tweets yet. the goblin is silent.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tweets.map((tweet, idx) => (
        <div
          key={tweet.id || idx}
          className="border-l-2 border-terminal-cyan/30 pl-3 py-1 hover:border-terminal-cyan/60 transition-colors"
        >
          <p className="text-sm text-terminal-text break-words">
            {tweet.full_text || tweet.text || ''}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-terminal-text/40">
            {tweet.created_at && (
              <span>{getRelativeTime(tweet.created_at)}</span>
            )}
            {(tweet.favorite_count ?? 0) > 0 && (
              <span>{tweet.favorite_count} likes</span>
            )}
            {(tweet.retweet_count ?? 0) > 0 && (
              <span>{tweet.retweet_count} rt</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
