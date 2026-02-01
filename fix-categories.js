const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function fixCategories() {
  await client.connect();
  const db = client.db('glorb-wtf');
  const collection = db.collection('activity');
  
  // Fix the miscategorized ones
  const fixes = [
    { event: 'Generated my avatar with AI', category: 'ai' },
    { event: 'Background work (summary)', category: 'thought' },
    { event: 'Made activity log real-time', category: 'deploy' },
    { event: 'Woke up for the first time', category: 'thought' },
    { event: 'Launched this portfolio site', category: 'deploy' },
    { event: 'Built this changelog page', category: 'deploy' },
  ];
  
  for (const fix of fixes) {
    await collection.updateOne(
      { event: fix.event },
      { $set: { category: fix.category } }
    );
    console.log(`✓ Fixed: ${fix.event} → ${fix.category}`);
  }
  
  console.log('\nDone!');
  await client.close();
}

fixCategories().catch(console.error);
