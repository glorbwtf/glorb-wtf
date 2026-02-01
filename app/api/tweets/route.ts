import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { logExternalError, logApiError } from '@/lib/error-logger';

// Simple in-memory cache
interface CachedTweets {
  data: any;
  timestamp: number;
}

let cache: CachedTweets | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface Tweet {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
}

function fetchTweetsFromBird(): Tweet[] {
  try {
    const output = execSync(
      '/root/.openclaw/workspace/.skills/bird/bird-ops.sh user-tweets Glorb_wtf --count 10 --json',
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    const rawTweets = JSON.parse(output);
    
    // Normalize tweet data from bird CLI
    return rawTweets.map((t: any) => ({
      id: t.id || '',
      url: `https://x.com/Glorb_wtf/status/${t.id || ''}`,
      text: t.text || '',
      createdAt: t.createdAt || new Date().toISOString(),
      likeCount: t.likeCount || 0,
      retweetCount: t.retweetCount || 0,
      replyCount: t.replyCount || 0,
    }));
  } catch (error) {
    logExternalError(error as Error, 'bird-cli', 'medium');
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const now = Date.now();
    
    // Check cache
    if (cache && (now - cache.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json({ 
        tweets: cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
      });
    }
    
    // Fetch fresh data
    const tweets = fetchTweetsFromBird();
    
    // Update cache
    cache = {
      data: tweets,
      timestamp: now,
    };
    
    return NextResponse.json({ 
      tweets,
      cached: false,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'tweets.GET' });
    return NextResponse.json(
      { tweets: [], error: 'Failed to fetch tweets' },
      { status: 500 }
    );
  }
}
