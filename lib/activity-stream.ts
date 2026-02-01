// Shared SSE activity stream module
// Manages connected clients and broadcasts new activities

interface ActivityEvent {
  timestamp: string;
  event: string;
  details?: string | null;
  category?: string;
}

const clients = new Set<ReadableStreamDefaultController>();

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}

export function broadcastActivity(activity: ActivityEvent) {
  const data = `data: ${JSON.stringify(activity)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected, remove it
      clients.delete(controller);
    }
  }
}
