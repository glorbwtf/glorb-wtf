'use client';

import { useState, useEffect, useRef } from 'react';

interface BrainEvent {
  id: string;
  time: string;
  text: string;
  category: 'think' | 'tool' | 'done' | 'state' | 'cron' | 'error';
}

const CATEGORY_COLORS: Record<string, string> = {
  think: 'text-terminal-yellow',
  tool: 'text-terminal-cyan',
  done: 'text-terminal-green',
  state: 'text-terminal-purple',
  cron: 'text-terminal-blue',
  error: 'text-terminal-red',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '??:??:??';
  }
}

export default function BrainStream() {
  const [events, setEvents] = useState<BrainEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Track if user has scrolled up manually
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    autoScrollRef.current = atBottom;
  }

  useEffect(() => {
    const es = new EventSource('/api/brain/stream');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const event: BrainEvent = JSON.parse(e.data);
        setEvents((prev) => {
          const next = [...prev, event];
          return next.length > 50 ? next.slice(-50) : next;
        });
      } catch {
        // ignore
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-terminal-yellow text-sm font-mono">$</span>
          <h2 className="text-terminal-green text-sm font-mono glow">BRAIN STREAM</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs">
          {connected ? (
            <>
              <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
              <span className="text-terminal-green/70">live</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-terminal-red rounded-full" />
              <span className="text-terminal-red/70">disconnected</span>
            </>
          )}
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="ml-4 max-h-[280px] overflow-y-auto font-mono text-xs space-y-0.5 scrollbar-thin"
      >
        {events.length === 0 ? (
          <p className="text-terminal-text/40">
            waiting for glorb to stir...<span className="animate-pulse">_</span>
          </p>
        ) : (
          <>
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-2">
                <span className="text-terminal-text/30 whitespace-nowrap">{formatTime(ev.time)}</span>
                <span className={CATEGORY_COLORS[ev.category] || 'text-terminal-text'}>
                  {ev.text}
                </span>
              </div>
            ))}
            <div className="text-terminal-text/30">
              <span className="animate-pulse">_</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
