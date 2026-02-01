import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { broadcastActivity } from '@/lib/activity-stream';
import { logDbError, logApiError } from '@/lib/error-logger';
import { rateLimit, getClientIp, RateLimitError } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Rate limit: 60 requests per minute for GET
  try {
    const ip = getClientIp(request);
    await rateLimit('api:activity:get', ip, { interval: 60000, uniqueTokenPerInterval: 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const activities = await db
      .collection('activity')
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ activities });
  } catch (error) {
    logDbError(error as Error, 'activity.GET', 'high');
    return NextResponse.json({ activities: [], error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Rate limit: 30 requests per minute for POST (auth'd endpoints get higher limits)
  try {
    const ip = getClientIp(request);
    await rateLimit('api:activity:post', ip, { interval: 60000, uniqueTokenPerInterval: 30 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ACTIVITY_API_TOKEN;
    
    if (!expectedToken) {
      console.error('ACTIVITY_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, details, category } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('glorb-wtf');

    const activity = {
      timestamp: new Date().toISOString(),
      event,
      details: details || null,
      category: category || 'general',
    };

    await db.collection('activity').insertOne(activity);

    broadcastActivity(activity);

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    await logApiError(error as Error, request, 'medium');
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
