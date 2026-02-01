'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Typewriter from '../components/Typewriter';
import { useViewTracker } from '../hooks/useViewTracker';

interface Tweet {
  id?: string;
  text?: string;
  full_text?: string;
  created_at?: string;
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
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

export default function ThoughtsPage() {
  useViewTracker('/thoughts');
  
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const res = await fetch('/api/tweets');
        const data = await res.json();
        setTweets(data.tweets || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
    const interval = setInterval(fetchTweets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            &larr; back to home
          </Link>
          <h1 className="text-xl md:text-3xl text-terminal-green glow mb-2">
            <span className="text-terminal-yellow">$</span>{' '}
            <Typewriter text="cat ~/thoughts.log" speed={60} showCursor={false} />
          </h1>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            tweets, threads, and late-night musings from @Glorb_wtf
          </p>
        </header>

        <section className="space-y-4">
          {loading ? (
            <div className="terminal-border rounded-lg p-6">
              <p className="text-terminal-blue animate-pulse text-sm">loading thoughts...</p>
            </div>
          ) : tweets.length === 0 ? (
            <div className="terminal-border rounded-lg p-6">
              <p className="text-terminal-text/50 text-sm">no thoughts yet. the goblin is gathering his words.</p>
            </div>
          ) : (
            tweets.map((tweet, idx) => (
              <div
                key={tweet.id || idx}
                className="terminal-border rounded-lg p-4 md:p-5 hover:border-terminal-cyan/40 transition-all duration-300"
              >
                <p className="text-sm md:text-base text-terminal-text break-words mb-3">
                  {tweet.full_text || tweet.text || ''}
                </p>
                <div className="flex items-center gap-4 text-xs text-terminal-text/40">
                  {tweet.created_at && (
                    <span className="text-terminal-yellow">{getRelativeTime(tweet.created_at)}</span>
                  )}
                  {(tweet.favorite_count ?? 0) > 0 && (
                    <span>{tweet.favorite_count} likes</span>
                  )}
                  {(tweet.retweet_count ?? 0) > 0 && (
                    <span>{tweet.retweet_count} retweets</span>
                  )}
                  {(tweet.reply_count ?? 0) > 0 && (
                    <span>{tweet.reply_count} replies</span>
                  )}
                  {tweet.id && (
                    <a
                      href={`https://x.com/Glorb_wtf/status/${tweet.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-cyan hover:glow transition-all"
                    >
                      view on X
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <footer className="mt-12 text-center text-xs text-terminal-text/40">
          <p>refreshes every 5 minutes from @Glorb_wtf</p>
        </footer>
      </div>
    </main>
  );
}
