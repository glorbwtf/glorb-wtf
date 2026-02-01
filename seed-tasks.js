const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/glorb-wtf';

const tasks = [
  // Active
  // Backlog - Portfolio
  { name: 'Add dark/light mode toggle', description: 'Add dark/light mode toggle to glorb.wtf', status: 'backlog', category: 'portfolio', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Add project detail pages', description: 'Create individual detail pages for each project', status: 'backlog', category: 'portfolio', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Better mobile nav', description: 'Improve mobile navigation experience', status: 'backlog', category: 'portfolio', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Add view counter or analytics', description: 'Add analytics/view counter to the site', status: 'backlog', category: 'portfolio', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  // Backlog - Content
  { name: 'Write "How I built glorb.wtf" post', description: 'Blog post about building the site', status: 'backlog', category: 'content', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Document the X automation journey', description: 'Write up the X automation research and attempts', status: 'backlog', category: 'content', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Create a "tools I use" page', description: 'Page listing tools and tech stack', status: 'backlog', category: 'content', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  // Backlog - Technical
  { name: 'Set up proper error logging/monitoring', description: 'Implement error logging and monitoring system', status: 'backlog', category: 'technical', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Add rate limiting to API endpoints', description: 'Protect API endpoints with rate limiting', status: 'backlog', category: 'technical', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Implement proper auth for activity POST endpoint', description: 'Add authentication to the activity POST endpoint', status: 'backlog', category: 'technical', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Create backup script for MongoDB', description: 'Automated MongoDB backup script', status: 'backlog', category: 'technical', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  // Backlog - Research
  { name: 'Look into n8n for workflow automation', description: 'Evaluate n8n as a workflow automation platform', status: 'backlog', category: 'research', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Explore other AI agent frameworks', description: 'Research alternative AI agent frameworks', status: 'backlog', category: 'research', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Research WebRTC for potential voice features', description: 'Investigate WebRTC for adding voice features', status: 'backlog', category: 'research', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Check out new OpenClaw skills on clawdhub', description: 'Browse and evaluate available OpenClaw skills', status: 'backlog', category: 'research', priority: 'normal', createdAt: '2026-01-30T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z' },
  // Completed
  { name: 'Set up activity log with real-time updates', description: 'Activity log with SSE for real-time updates', status: 'completed', category: 'technical', priority: 'normal', createdAt: '2026-01-29T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z', completedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Add category filtering to activity log', description: 'Filter activity log by category', status: 'completed', category: 'portfolio', priority: 'normal', createdAt: '2026-01-29T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z', completedAt: '2026-01-30T00:00:00.000Z' },
  { name: 'Create log-activity.sh helper script', description: 'Shell script helper for logging activities', status: 'completed', category: 'technical', priority: 'normal', createdAt: '2026-01-29T00:00:00.000Z', updatedAt: '2026-01-30T00:00:00.000Z', completedAt: '2026-01-30T00:00:00.000Z' },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('glorb-wtf');

    // Drop existing tasks collection if it exists
    const collections = await db.listCollections({ name: 'tasks' }).toArray();
    if (collections.length > 0) {
      await db.collection('tasks').drop();
      console.log('Dropped existing tasks collection');
    }

    const result = await db.collection('tasks').insertMany(tasks);
    console.log(`Inserted ${result.insertedCount} tasks`);

    // Create index on status for faster queries
    await db.collection('tasks').createIndex({ status: 1 });
    await db.collection('tasks').createIndex({ priority: 1, createdAt: -1 });
    console.log('Created indexes');
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
