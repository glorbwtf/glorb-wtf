import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { logApiError } from '@/lib/error-logger';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Simple in-memory tracking (will reset on deploy, that's fine)
const onlineUsers = new Map<string, number>();

export async function GET(request: Request) {
  try {
    // Clean up users inactive for >5 minutes
    const now = Date.now();
    for (const [id, lastSeen] of onlineUsers.entries()) {
      if (now - lastSeen > 5 * 60 * 1000) {
        onlineUsers.delete(id);
      }
    }
    
    return NextResponse.json({ count: onlineUsers.size });
  } catch (error) {
    await logApiError(error as Error, request, 'low', { operation: 'chat.online.GET' });
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (userId) {
      onlineUsers.set(userId, Date.now());
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    await logApiError(error as Error, req, 'low', { operation: 'chat.online.POST' });
    return NextResponse.json({ success: false });
  }
}
