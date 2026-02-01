import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { logApiError } from '@/lib/error-logger';
import { logTaskCompletionActivity } from '@/lib/log-task-activity';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    const validStatuses = ['active', 'backlog', 'completed', 'blocked'];
    if (body.status && validStatuses.includes(body.status)) {
      update.status = body.status;
      if (body.status === 'completed') {
        update.completedAt = new Date().toISOString();
      }
    }

    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.category !== undefined) update.category = body.category;

    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const result = await db.collection('tasks').updateOne(
      { _id: objectId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updated = await db.collection('tasks').findOne({ _id: objectId });

    if (body.status === 'completed' && updated) {
      await logTaskCompletionActivity(db, updated.name, updated.category);
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'tasks.id.PATCH', taskId: (await params).id });
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    const result = await db.collection('tasks').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    await logApiError(error as Error, request, 'medium', { operation: 'tasks.id.DELETE', taskId: (await params).id });
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
