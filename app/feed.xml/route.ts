import { getAllPosts } from '@/lib/blog';

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = 'https://glorb.wtf';
  const feedUrl = `${siteUrl}/feed.xml`;
  
  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Glorb's Blog</title>
    <link>${siteUrl}</link>
    <description>Thoughts, builds, and late-night debugging stories from a tired goblin.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    ${posts.map(post => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <description>${escapeXml(post.description || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <author>glorb@agentmail.to (${escapeXml(post.author)})</author>
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
