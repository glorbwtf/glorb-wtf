import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { logDbError } from '@/lib/error-logger';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    
    // Search across all three collections
    let item = await db.collection('projects').findOne({ id });
    if (!item) item = await db.collection('skills').findOne({ id });
    if (!item) item = await db.collection('experiments').findOne({ id });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    const { id } = await context.params;
    await logDbError(error as Error, `fetch-project-detail:${id}`, 'medium');
    console.error('Error fetching project detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
