import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { logDbError } from '@/lib/error-logger';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    
    // Fetch all three categories
    const projects = await db.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
    const skills = await db.collection('skills').find({}).sort({ createdAt: -1 }).toArray();
    const experiments = await db.collection('experiments').find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ projects, skills, experiments });
  } catch (error) {
    await logDbError(error as Error, 'fetch-projects', 'medium');
    console.error('Error fetching work items:', error);
    return NextResponse.json({ projects: [], skills: [], experiments: [], error: 'Failed to fetch' }, { status: 500 });
  }
}
