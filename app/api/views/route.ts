import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { rateLimit, getClientIp, RateLimitError } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function getGeoData(req: NextRequest) {
  // Try Cloudflare headers first (if behind Cloudflare)
  const cfCountry = req.headers.get('cf-ipcountry');
  const cfTimezone = req.headers.get('cf-timezone');
  
  if (cfCountry && cfCountry !== 'XX') {
    return {
      country: cfCountry,
      timezone: cfTimezone || 'UTC',
    };
  }

  // Fallback: unknown
  return { country: 'XX', timezone: 'UTC' };
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 views per minute per IP (prevent spam)
  try {
    const ip = getClientIp(req);
    await rateLimit('api:views:post', ip, { interval: 60000, uniqueTokenPerInterval: 20 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const { page, referrer, sessionId, duration } = await req.json();
    if (!page) {
      return NextResponse.json({ error: 'page required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const geo = getGeoData(req);

    const client = await clientPromise;
    const db = client.db('glorb');
    const views = db.collection('views');

    await views.insertOne({
      page,
      referrer: referrer || null,
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent'),
      ip: ipAddress, // Store for deduplication only; not exposed publicly
      country: geo.country,
      timezone: geo.timezone,
      sessionId: sessionId || null,
      duration: duration || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Failed to log view' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Rate limit: 60 requests per minute for analytics reads
  try {
    const ip = getClientIp(req);
    await rateLimit('api:views:get', ip, { interval: 60000, uniqueTokenPerInterval: 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': error.retryAfter.toString() } }
      );
    }
  }

  try {
    const url = new URL(req.url);
    const page = url.searchParams.get('page');
    const trends = url.searchParams.get('trends') === 'true';

    const client = await clientPromise;
    const db = client.db('glorb');
    const views = db.collection('views');

    if (page) {
      const count = await views.countDocuments({ page });
      const recent = await views
        .find({ page })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return NextResponse.json({
        page,
        count,
        recent: recent.map(v => ({
          timestamp: v.timestamp,
          referrer: v.referrer,
        })),
      });
    }

    // Get all page views grouped by page
    const aggregate = await views.aggregate([
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 },
          lastView: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();

    const total = await views.countDocuments();

    const response: any = {
      total,
      pages: aggregate.map(a => ({
        page: a._id,
        count: a.count,
        lastView: a.lastView,
      })),
    };

    // Add trend data if requested
    if (trends) {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Hourly data for last 24h
      const hourlyTrends = await views.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        {
          $group: {
            _id: {
              hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.hour': 1 } }
      ]).toArray();

      // Daily data for last 7 days
      const dailyTrends = await views.aggregate([
        { $match: { timestamp: { $gte: last7d } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.day': 1 } }
      ]).toArray();

      // Top pages in last 30 days
      const topPages30d = await views.aggregate([
        { $match: { timestamp: { $gte: last30d } } },
        {
          $group: {
            _id: '$page',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      // Real-time (last 5 minutes)
      const last5m = new Date(now.getTime() - 5 * 60 * 1000);
      const realtimeCount = await views.countDocuments({ timestamp: { $gte: last5m } });

      // Geographic data (country distribution)
      const geoData = await views.aggregate([
        { $match: { country: { $exists: true, $ne: 'XX' } } },
        {
          $group: {
            _id: '$country',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      // Timezone heatmap (hour of day when visitors browse)
      const timezoneHeatmap = await views.aggregate([
        { $match: { timestamp: { $gte: last7d } } },
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.hour': 1 } }
      ]).toArray();

      // Session metrics (average duration, bounce rate estimation)
      const sessionMetrics = await views.aggregate([
        {
          $match: {
            sessionId: { $exists: true, $ne: null },
            timestamp: { $gte: last30d }
          }
        },
        {
          $group: {
            _id: '$sessionId',
            pageCount: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            firstPage: { $first: '$timestamp' },
            lastPage: { $last: '$timestamp' }
          }
        }
      ]).toArray();

      const totalSessions = sessionMetrics.length;
      const bouncedSessions = sessionMetrics.filter(s => s.pageCount === 1).length;
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
      
      const avgSessionDuration = sessionMetrics.reduce((acc, s) => {
        const duration = s.avgDuration || 0;
        return acc + duration;
      }, 0) / (totalSessions || 1);

      // Referrer analytics: aggregate and categorize traffic sources
      const referrerData = await views.aggregate([
        { 
          $match: { 
            referrer: { $exists: true, $ne: null },
            timestamp: { $gte: last30d }
          } 
        },
        {
          $group: {
            _id: '$referrer',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]).toArray();

      // Categorize referrers
      const categorizeReferrer = (ref: string): string => {
        if (!ref) return 'direct';
        const lower = ref.toLowerCase();
        
        // Social platforms
        if (lower.includes('twitter.com') || lower.includes('t.co') || lower.includes('x.com')) return 'social';
        if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'social';
        if (lower.includes('linkedin.com')) return 'social';
        if (lower.includes('reddit.com')) return 'social';
        if (lower.includes('instagram.com')) return 'social';
        if (lower.includes('tiktok.com')) return 'social';
        if (lower.includes('discord.com') || lower.includes('discord.gg')) return 'social';
        
        // Search engines
        if (lower.includes('google.com') || lower.includes('google.')) return 'search';
        if (lower.includes('bing.com')) return 'search';
        if (lower.includes('duckduckgo.com')) return 'search';
        if (lower.includes('yahoo.com')) return 'search';
        if (lower.includes('baidu.com')) return 'search';
        
        // Direct or other
        return 'other';
      };

      const extractDomain = (ref: string): string => {
        if (!ref) return 'Direct / None';
        try {
          const url = new URL(ref);
          return url.hostname.replace(/^www\./, '');
        } catch {
          return ref;
        }
      };

      const referrers = referrerData.map(r => ({
        source: extractDomain(r._id),
        count: r.count,
        category: categorizeReferrer(r._id)
      }));

      // Aggregate by category
      const categoryTotals = new Map<string, number>();
      referrers.forEach(r => {
        categoryTotals.set(r.category, (categoryTotals.get(r.category) || 0) + r.count);
      });

      // Add direct traffic count
      const directCount = await views.countDocuments({
        $or: [
          { referrer: { $exists: false } },
          { referrer: null },
          { referrer: '' }
        ],
        timestamp: { $gte: last30d }
      });

      if (directCount > 0) {
        categoryTotals.set('direct', (categoryTotals.get('direct') || 0) + directCount);
        referrers.push({
          source: 'Direct / None',
          count: directCount,
          category: 'direct'
        });
      }

      // Sort referrers by count after adding direct
      referrers.sort((a, b) => b.count - a.count);

      const referrersByCategory = Array.from(categoryTotals.entries()).map(([category, count]) => ({
        category,
        count
      })).sort((a, b) => b.count - a.count);

      response.trends = {
        hourly: hourlyTrends.map(h => ({
          time: h._id.hour,
          count: h.count
        })),
        daily: dailyTrends.map(d => ({
          date: d._id.day,
          count: d.count
        })),
        topPages30d: topPages30d.map(p => ({
          page: p._id,
          count: p.count
        })),
        realtime: {
          last5m: realtimeCount
        },
        geography: geoData.map(g => ({
          country: g._id,
          count: g.count
        })),
        timeHeatmap: timezoneHeatmap.map(t => ({
          hour: t._id.hour,
          count: t.count
        })),
        sessions: {
          total: totalSessions,
          bounceRate: Math.round(bounceRate),
          avgDuration: Math.round(avgSessionDuration)
        },
        referrers,
        referrersByCategory
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('View fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}
