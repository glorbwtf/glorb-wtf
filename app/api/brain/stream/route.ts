import { startWatcher, addBrainClient, removeBrainClient, getRecentEvents } from '@/lib/brain-stream';
import { logApiError } from '@/lib/error-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  try {
    const stream = new ReadableStream({
      start(controller) {
        try {
          startWatcher();
          addBrainClient(controller);

          // Send initial connected message
          controller.enqueue(encoder.encode(': connected\n\n'));

          // Send backfill of recent events
          const recent = getRecentEvents();
          for (const event of recent) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch {
              break;
            }
          }

          // Keepalive every 30s to avoid Cloudflare timeout
          keepaliveInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': keepalive\n\n'));
            } catch {
              if (keepaliveInterval) clearInterval(keepaliveInterval);
              removeBrainClient(controller);
            }
          }, 30000);
        } catch (error) {
          logApiError(error as Error, request, 'medium', { operation: 'brain.stream.start' });
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          removeBrainClient(controller);
        }
      },
      cancel(controller) {
        if (keepaliveInterval) clearInterval(keepaliveInterval);
        removeBrainClient(controller);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    await logApiError(error as Error, request, 'high', { operation: 'brain.stream.GET' });
    return new Response('Stream initialization failed', { status: 500 });
  }
}
