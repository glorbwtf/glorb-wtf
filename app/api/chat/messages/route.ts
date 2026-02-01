import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { logDbError, logApiError } from '@/lib/error-logger';
import { rateLimit, getClientIp, RateLimitError } from '@/lib/rate-limit';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

export async function GET(request: Request) {
  // Rate limit: 30 requests per minute for GET
  try {
    const ip = getClientIp(request);
    await rateLimit('api:chat:messages:get', ip, { interval: 60000, uniqueTokenPerInterval: 30 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('glorb-wtf');
    
    const messages = await db.collection('chat_messages')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    await client.close();
    
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'chat.messages.GET' });
    console.error('Error fetching messages:', error);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 messages per minute for POST (stricter for writes)
  try {
    const ip = getClientIp(req);
    await rateLimit('api:chat:messages:post', ip, { interval: 60000, uniqueTokenPerInterval: 10 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const { username, content, isGlorb } = await req.json();
    
    if (!username || !content) {
      return NextResponse.json({ error: 'Missing username or content' }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('glorb-wtf');
    
    const message = {
      id: Date.now().toString(),
      userId: isGlorb ? 'glorb' : `user_${Date.now()}`,
      username,
      content: content.slice(0, 500), // Limit message length
      timestamp: new Date().toISOString(),
      isGlorb: isGlorb || false,
    };
    
    await db.collection('chat_messages').insertOne(message);
    
    // Keep only last 100 messages
    const allMessages = await db.collection('chat_messages')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();
    
    if (allMessages.length > 100) {
      const toDelete = allMessages.slice(100);
      await db.collection('chat_messages').deleteMany({
        id: { $in: toDelete.map(m => m.id) }
      });
    }
    
    await client.close();
    
    return NextResponse.json({ success: true, message });
  } catch (error) {
    await logApiError(error as Error, req, 'medium', { operation: 'chat.messages.POST' });
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
