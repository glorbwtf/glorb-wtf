import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { logDbError, logApiError } from '@/lib/error-logger';
import { logTaskCompletionActivity } from '@/lib/log-task-activity';
import { rateLimit, getClientIp, RateLimitError } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Rate limit: 60 requests per minute
  try {
    const ip = getClientIp(request);
    await rateLimit('api:tasks:get', ip, { interval: 60000, uniqueTokenPerInterval: 60 });
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
    const tasks = await db
      .collection('tasks')
      .find({})
      .sort({ priority: 1, createdAt: -1 })
      .toArray();

    const active = tasks.filter(t => t.status === 'active' || t.status === 'blocked');
    const backlog = tasks.filter(t => t.status === 'backlog');
    const completed = tasks.filter(t => t.status === 'completed');

    return NextResponse.json({ active, backlog, completed });
  } catch (error) {
    logDbError(error as Error, 'tasks.GET', 'high');
    return NextResponse.json(
      { active: [], backlog: [], completed: [], error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Rate limit: 20 task creations per minute
  try {
    const ip = getClientIp(request);
    await rateLimit('api:tasks:post', ip, { interval: 60000, uniqueTokenPerInterval: 20 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const body = await request.json();
    const { name, description, status, category, priority, notes } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'name and description are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'backlog', 'completed', 'blocked'];
    const taskStatus = validStatuses.includes(status) ? status : 'backlog';

    const validCategories = ['portfolio', 'content', 'technical', 'research', 'infra', 'github', 'ai', 'browser', 'x', 'thought', 'deploy'];
    const taskCategory = validCategories.includes(category) ? category : undefined;

    const validPriorities = ['high', 'normal', 'low'];
    const taskPriority = validPriorities.includes(priority) ? priority : 'normal';

    const now = new Date().toISOString();
    const task = {
      name,
      description,
      status: taskStatus,
      category: taskCategory,
      priority: taskPriority,
      createdAt: now,
      updatedAt: now,
      completedAt: taskStatus === 'completed' ? now : undefined,
      notes: notes || undefined,
    };

    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const result = await db.collection('tasks').insertOne(task);

    return NextResponse.json(
      { task: { ...task, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'task.POST' });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Rate limit: 30 task updates per minute
  try {
    const ip = getClientIp(request);
    await rateLimit('api:tasks:patch', ip, { interval: 60000, uniqueTokenPerInterval: 30 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    const validStatuses = ['active', 'backlog', 'completed', 'blocked'];
    if (status && validStatuses.includes(status)) {
      update.status = status;
      if (status === 'completed') {
        update.completedAt = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      update.notes = notes;
    }

    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (status === 'completed') {
      const task = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
      if (task) {
        await logTaskCompletionActivity(db, task.name, task.category);
      }
    }

    return NextResponse.json({ updated: true });
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'task.PATCH' });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
