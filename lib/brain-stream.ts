import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BrainEvent {
  id: string;
  time: string;
  text: string;
  category: 'think' | 'tool' | 'done' | 'state' | 'cron' | 'error';
}

const LOG_DIR = '/tmp/openclaw';
const BUFFER_SIZE = 50;
const POLL_INTERVAL = 500;

// Survive Next.js HMR in dev by storing mutable state on globalThis
interface BrainWatcherState {
  recentEvents: BrainEvent[];
  clients: Set<ReadableStreamDefaultController>;
  watching: boolean;
  currentFile: string;
  fileOffset: number;
  pollTimer: ReturnType<typeof setInterval> | null;
}

const g = globalThis as unknown as { __brainWatcher?: BrainWatcherState };
if (!g.__brainWatcher) {
  g.__brainWatcher = {
    recentEvents: [],
    clients: new Set(),
    watching: false,
    currentFile: '',
    fileOffset: 0,
    pollTimer: null,
  };
}
const state = g.__brainWatcher;

function getLogPath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `openclaw-${date}.log`);
}

function parseEvent(line: string): BrainEvent | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }

  const msg = typeof parsed['1'] === 'string' ? parsed['1'] : '';
  const time = typeof parsed['time'] === 'string' ? parsed['time'] : new Date().toISOString();

  // Ordered allowlist: only these patterns produce events
  if (msg.startsWith('embedded run start:')) {
    const modelMatch = msg.match(/model=(\S+)/);
    const model = modelMatch ? modelMatch[1].replace(/^.*\//, '') : 'unknown';
    return { id: crypto.randomUUID(), time, text: `brain goo bubbling... (${model})`, category: 'think' };
  }

  if (msg.startsWith('embedded run tool start:')) {
    const toolMatch = msg.match(/tool=(\S+)/);
    const tool = toolMatch ? toolMatch[1] : '';
    const toolLabels: Record<string, string> = {
      exec: 'smashing terminal keys',
      read: 'peering at scrolls',
      edit: 'scribbling on parchment',
      write: 'forging new scroll',
      web_search: 'sniffing the web pipes',
      web_fetch: 'snatching webpage',
      cron: 'winding the clock gears',
      process: 'poking a daemon',
      memory_get: 'rummaging through brain jar',
    };
    const text = toolLabels[tool] || `tinkering with: ${tool}`;
    return { id: crypto.randomUUID(), time, text, category: 'tool' };
  }

  if (msg.startsWith('embedded run done:')) {
    const durationMatch = msg.match(/durationMs=(\d+)/);
    const ms = durationMatch ? parseInt(durationMatch[1], 10) : 0;
    const seconds = (ms / 1000).toFixed(1);
    return { id: crypto.randomUUID(), time, text: `task done! rested for ${seconds}s`, category: 'done' };
  }

  if (msg.startsWith('session state:')) {
    if (msg.includes('new=processing')) {
      return { id: crypto.randomUUID(), time, text: 'GLORB AWAKENS', category: 'state' };
    }
    if (msg.includes('new=idle')) {
      return { id: crypto.randomUUID(), time, text: 'glorb naps...zzz', category: 'state' };
    }
  }

  // Everything else is silently dropped
  return null;
}

function pushEvent(event: BrainEvent) {
  state.recentEvents.push(event);
  if (state.recentEvents.length > BUFFER_SIZE) {
    state.recentEvents = state.recentEvents.slice(-BUFFER_SIZE);
  }
  broadcast(event);
}

function broadcast(event: BrainEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  for (const controller of state.clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      state.clients.delete(controller);
    }
  }
}

function pollFile() {
  const logPath = getLogPath();

  // Handle log rotation: date changed
  if (logPath !== state.currentFile) {
    state.currentFile = logPath;
    state.fileOffset = 0;
    try {
      const stat = fs.statSync(logPath);
      if (stat.size > 0) {
        state.fileOffset = stat.size;
      }
    } catch {
      return; // File doesn't exist yet
    }
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(logPath);
  } catch {
    return; // File doesn't exist
  }

  if (stat.size <= state.fileOffset) {
    if (stat.size < state.fileOffset) {
      state.fileOffset = 0; // File was truncated, restart
    }
    return;
  }

  // Read new bytes
  const fd = fs.openSync(logPath, 'r');
  const buf = Buffer.alloc(stat.size - state.fileOffset);
  fs.readSync(fd, buf, 0, buf.length, state.fileOffset);
  fs.closeSync(fd);
  state.fileOffset = stat.size;

  const chunk = buf.toString('utf-8');
  const lines = chunk.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const event = parseEvent(trimmed);
    if (event) {
      pushEvent(event);
    }
  }
}

/** Read the tail of the log file and backfill the event buffer with up to BUFFER_SIZE events. */
function backfillFromLog(logPath: string): number {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(logPath);
  } catch {
    return 0;
  }
  if (stat.size === 0) return stat.size;

  // Read the last chunk of the file — most matchable lines are short,
  // but read a generous window to ensure we capture enough events.
  const TAIL_BYTES = Math.min(stat.size, 2 * 1024 * 1024); // up to 2 MB
  const buf = Buffer.alloc(TAIL_BYTES);
  const fd = fs.openSync(logPath, 'r');
  fs.readSync(fd, buf, 0, TAIL_BYTES, stat.size - TAIL_BYTES);
  fs.closeSync(fd);

  const lines = buf.toString('utf-8').split('\n');
  const events: BrainEvent[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const event = parseEvent(trimmed);
    if (event) events.push(event);
  }

  // Keep only the last BUFFER_SIZE events
  state.recentEvents = events.slice(-BUFFER_SIZE);
  return stat.size;
}

export function startWatcher() {
  if (state.watching) return;
  state.watching = true;

  const logPath = getLogPath();
  state.currentFile = logPath;

  // Backfill recent events from the existing log, then set offset to end of file
  const fileSize = backfillFromLog(logPath);
  state.fileOffset = fileSize;

  state.pollTimer = setInterval(pollFile, POLL_INTERVAL);
}

export function addBrainClient(controller: ReadableStreamDefaultController) {
  state.clients.add(controller);
}

export function removeBrainClient(controller: ReadableStreamDefaultController) {
  state.clients.delete(controller);
}

export function getRecentEvents(): BrainEvent[] {
  return [...state.recentEvents];
}
