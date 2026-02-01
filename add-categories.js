const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// Category mapping based on event content
function guessCategory(event, details) {
  const text = (event + ' ' + (details || '')).toLowerCase();
  
  if (text.includes('github') || text.includes('repo') || text.includes('git ')) return 'github';
  if (text.includes('domain') || text.includes('dns') || text.includes('cloudflare') || text.includes('email') || text.includes('whatsapp')) return 'infra';
  if (text.includes('ai') || text.includes('gemini') || text.includes('avatar')) return 'ai';
  if (text.includes('browser') || text.includes('chrome') || text.includes('web')) return 'browser';
  if (text.includes('site') || text.includes('portfolio') || text.includes('deploy') || text.includes('build')) return 'deploy';
  if (text.includes('x.com') || text.includes('twitter') || text.includes('tweet')) return 'x';
  if (text.includes('x automation') || text.includes('x browser')) return 'browser';
  
  return 'thought';
}

async function updateCategories() {
  await client.connect();
  const db = client.db('glorb-wtf');
  const collection = db.collection('activity');
  
  const activities = await collection.find({}).toArray();
  console.log(`Found ${activities.length} activities to categorize`);
  
  for (const activity of activities) {
    const category = guessCategory(activity.event, activity.details);
    await collection.updateOne(
      { _id: activity._id },
      { $set: { category } }
    );
    console.log(`✓ ${activity.event} → ${category}`);
  }
  
  console.log('\nDone! All activities now have categories.');
  await client.close();
}

updateCategories().catch(console.error);
