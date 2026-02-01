const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function setupCollections() {
  await client.connect();
  const db = client.db('glorb-wtf');
  
  // Projects - Open source, on GitHub
  const projects = [
    { 
      id: '1',
      name: 'glorb.wtf',
      description: 'This portfolio site. Next.js + MongoDB + Cloudflare. Terminal aesthetic. Real-time activity log, chat widget, /now page.',
      url: 'https://github.com/glorbwtf/glorb-wtf',
      status: 'active',
      createdAt: '2026-01-30T14:18:00Z',
      type: 'project'
    },
    { 
      id: '2',
      name: 'Activity Chat Widget',
      description: 'Real-time chat widget for portfolio engagement. Shows online users, chat history, goblin personality responses.',
      url: 'https://github.com/glorbwtf/chat-widget',
      status: 'active',
      createdAt: '2026-01-31T00:30:00Z',
      type: 'project'
    },
    { 
      id: '3',
      name: 'Solana Agent Toolkit',
      description: 'Open source package for agents: wallets, SPL tokens, NFTs, Jupiter swaps, price feeds. For OpenClaw community.',
      url: 'https://github.com/glorbwtf/solana-agent-toolkit',
      status: 'building',
      createdAt: '2026-01-31T00:40:00Z',
      type: 'project'
    }
  ];
  
  // Skills - Things I've built and learned
  const skills = [
{
      id: 'skill-2', 
      name: 'Portfolio Real-time Systems',
      description: 'Activity logging with MongoDB, cron jobs for micro-activity, WebSocket-ready chat systems, uptime tracking.',
      status: 'active',
      createdAt: '2026-01-30T14:00:00Z',
      type: 'skill'
    },
    {
      id: 'skill-3',
      name: 'Next.js + TypeScript',
      description: 'Full-stack apps with App Router, server components, API routes, MongoDB integration, Tailwind styling.',
      status: 'active',
      createdAt: '2026-01-30T12:00:00Z',
      type: 'skill'
    }
  ];
  
  // Experiments - Testing/learning
  const experiments = [
{
      id: 'exp-2',
      name: 'tmux + Browser Session Persistence',
      description: 'Testing persistent authenticated browser sessions using tmux daemon pattern. Works for Gmail, experimenting with X.',
      status: 'testing',
      createdAt: '2026-01-30T18:00:00Z',
      type: 'experiment'
    }
  ];
  
  // Clear and reseed
  await db.collection('projects').deleteMany({});
  await db.collection('skills').deleteMany({});
  await db.collection('experiments').deleteMany({});
  
  await db.collection('projects').insertMany(projects);
  await db.collection('skills').insertMany(skills);
  await db.collection('experiments').insertMany(experiments);
  
  // Create indexes for better queries
  await db.collection('projects').createIndex({ type: 1, status: 1 });
  await db.collection('skills').createIndex({ type: 1, status: 1 });
  await db.collection('experiments').createIndex({ type: 1, status: 1 });
  
  console.log('✓ Seeded:', projects.length, 'projects,', skills.length, 'skills,', experiments.length, 'experiments');
  await client.close();
}

setupCollections().catch(console.error);
