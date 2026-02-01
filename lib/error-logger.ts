import { NextRequest } from 'next/server';
import clientPromise from './mongodb';

export interface ErrorLog {
  timestamp: string;
  type: 'api' | 'database' | 'external' | 'client';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

/**
 * Log errors to the database with full context
 */
async function saveError(errorLog: ErrorLog): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');
    await db.collection('errors').insertOne(errorLog);
  } catch (e) {
    // Fallback to console if DB logging fails
    console.error('Failed to save error to DB:', e);
    console.error('Original error:', errorLog);
  }
}

/**
 * Log API errors with request context
 */
export async function logApiError(
  error: Error,
  request: Request | NextRequest,
  severity: ErrorLog['severity'] = 'medium',
  extraContext?: Record<string, unknown>
): Promise<void> {
  const url = request.url;
  const method = request.method;
  
  // Safely get headers
  const headers: Record<string, string> = {};
  try {
    request.headers.forEach((value, key) => {
      if (!key.toLowerCase().includes('auth') && !key.toLowerCase().includes('cookie')) {
        headers[key] = value;
      }
    });
  } catch {
    // Headers might not be accessible
  }

  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type: 'api',
    severity,
    message: error.message,
    stack: error.stack,
    context: {
      url,
      method,
      headers,
      ...extraContext,
    },
  };

  await saveError(errorLog);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', errorLog);
  }
}

/**
 * Log database errors
 */
export async function logDbError(
  error: Error,
  operation: string,
  severity: ErrorLog['severity'] = 'high'
): Promise<void> {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type: 'database',
    severity,
    message: error.message,
    stack: error.stack,
    context: {
      operation,
      connectionUri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***@') || 'default',
    },
  };

  await saveError(errorLog);

  if (process.env.NODE_ENV === 'development') {
    console.error('[DB Error]', errorLog);
  }
}

/**
 * Log external service errors (bird CLI, etc.)
 */
export async function logExternalError(
  error: Error,
  service: string,
  severity: ErrorLog['severity'] = 'medium',
  extraContext?: Record<string, unknown>
): Promise<void> {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type: 'external',
    severity,
    message: error.message,
    stack: error.stack,
    context: {
      service,
      ...extraContext,
    },
  };

  await saveError(errorLog);

  if (process.env.NODE_ENV === 'development') {
    console.error('[External Error]', errorLog);
  }
}

/**
 * Log client-side errors captured from window.onerror
 */
export async function logClientError(
  error: {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  },
  userAgent?: string,
  url?: string
): Promise<void> {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type: 'client',
    severity: 'medium',
    message: error.message,
    stack: error.stack,
    context: {
      filename: error.filename,
      line: error.lineno,
      column: error.colno,
      userAgent,
      url,
    },
  };

  await saveError(errorLog);

  if (process.env.NODE_ENV === 'development') {
    console.error('[Client Error]', errorLog);
  }
}

/**
 * Get recent errors for monitoring
 */
export async function getRecentErrors(
  limit: number = 50,
  severity?: ErrorLog['severity']
): Promise<ErrorLog[]> {
  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');

    const query: Record<string, unknown> = {};
    if (severity) {
      query.severity = severity;
    }

    const errors = await db
      .collection('errors')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return errors as unknown as ErrorLog[];
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    return [];
  }
}

/**
 * Get error statistics for monitoring
 */
export async function getErrorStats(timeWindowHours: number = 24): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> {
  try {
    const client = await clientPromise;
    const db = client.db('glorb-wtf');

    const since = new Date();
    since.setHours(since.getHours() - timeWindowHours);

    const errors = await db
      .collection('errors')
      .find({
        timestamp: { $gte: since.toISOString() },
      })
      .toArray();

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const error of errors) {
      const typedError = error as unknown as ErrorLog;
      bySeverity[typedError.severity] = (bySeverity[typedError.severity] || 0) + 1;
      byType[typedError.type] = (byType[typedError.type] || 0) + 1;
    }

    return {
      total: errors.length,
      bySeverity,
      byType,
    };
  } catch (error) {
    console.error('Failed to get error stats:', error);
    return { total: 0, bySeverity: {}, byType: {} };
  }
}
