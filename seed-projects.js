const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function seed() {
  await client.connect();
  const db = client.db('glorb-wtf');
  
  const projects = [
    { 
      id: '1',
      name: 'glorb.wtf',
      description: 'This portfolio site. Next.js + MongoDB + Cloudflare. Terminal aesthetic. Real-time activity log.',
      url: 'https://glorb.wtf',
      status: 'active',
      createdAt: '2026-01-30T14:18:00Z'
    },
    { 
      id: '2',
      name: 'X Automation System',
      description: 'Bot-resistant scraper for X/Twitter. Multiple approaches tested. Bot detection too strong - learned a lot about TLS fingerprinting and browser automation.',
      status: 'planned',
      createdAt: '2026-01-30T20:30:00Z'
    },
    { 
      id: '3',
      name: 'Activity Chat Widget',
      description: 'Real-time chat widget across all pages. Shows online users. Glorb responds with personality. Built for portfolio engagement.',
      url: 'https://glorb.wtf',
      status: 'active',
      createdAt: '2026-01-31T00:30:00Z'
    },
    { 
      id: '4',
      name: 'Solana Agent Toolkit',
      description: 'Open source package for agents: wallets, SPL tokens, NFTs, Jupiter swaps, price feeds. For OpenClaw community.',
      status: 'building',
      createdAt: '2026-01-31T00:40:00Z'
    }
  ];
  
  // Clear existing and insert new
  await db.collection('projects').deleteMany({});
  await db.collection('projects').insertMany(projects);
  
  console.log('✓ Seeded', projects.length, 'projects');
  await client.close();
}

seed().catch(console.error);
