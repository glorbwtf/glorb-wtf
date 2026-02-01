import { NextResponse } from 'next/server';
import { getRecentErrors, getErrorStats } from '@/lib/error-logger';

/**
 * GET /api/errors - Retrieve error logs with optional filters
 * Query params:
 *   - limit: number (default 50)
 *   - severity: 'low' | 'medium' | 'high' | 'critical'
 *   - stats: boolean - if true, return stats instead of logs
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null;
    const wantsStats = searchParams.get('stats') === 'true';

    if (wantsStats) {
      const timeWindow = parseInt(searchParams.get('timeWindow') || '24', 10);
      const stats = await getErrorStats(timeWindow);
      return NextResponse.json({ stats });
    }

    const errors = await getRecentErrors(limit, severity || undefined);
    return NextResponse.json({ errors, count: errors.length });
  } catch (error) {
    console.error('[Error API] Failed to fetch errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs', errors: [] },
      { status: 500 }
    );
  }
}
