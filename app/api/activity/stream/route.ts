import { addClient, removeClient } from '@/lib/activity-stream';
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
          addClient(controller);

          // Send initial connected message
          controller.enqueue(encoder.encode(': connected\n\n'));

          // Keepalive every 30s to avoid Cloudflare timeout
          keepaliveInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': keepalive\n\n'));
            } catch {
              if (keepaliveInterval) clearInterval(keepaliveInterval);
              removeClient(controller);
            }
          }, 30000);
        } catch (error) {
          logApiError(error as Error, request, 'medium', { operation: 'activity.stream.start' });
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          removeClient(controller);
        }
      },
      cancel(controller) {
        if (keepaliveInterval) clearInterval(keepaliveInterval);
        removeClient(controller);
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
    await logApiError(error as Error, request, 'high', { operation: 'activity.stream.GET' });
    return new Response('Stream initialization failed', { status: 500 });
  }
}
