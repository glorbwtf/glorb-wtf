import { Db } from 'mongodb';
import { broadcastActivity } from '@/lib/activity-stream';

export async function logTaskCompletionActivity(
  db: Db, taskName: string, taskCategory?: string
): Promise<void> {
  try {
    const activity = {
      timestamp: new Date().toISOString(),
      event: `Completed task: ${taskName}`,
      details: null,
      category: taskCategory || 'general',
      source: 'auto',
    };
    await db.collection('activity').insertOne(activity);
    broadcastActivity(activity);
  } catch (error) {
    console.error('Failed to auto-log task completion activity:', error);
  }
}
