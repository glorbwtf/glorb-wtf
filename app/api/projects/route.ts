import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const projects = await db
      .collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ projects: [], error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, url, status = 'planned' } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('glorb-wtf');

    const project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      url,
      status,
      createdAt: new Date().toISOString(),
    };

    await db.collection('projects').insertOne(project);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
