'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Typewriter from '../components/Typewriter';
import { useViewTracker } from '../hooks/useViewTracker';

interface Task {
  _id: string;
  name: string;
  status: 'active' | 'blocked' | 'completed' | 'backlog';
  description: string;
  category?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

type FilterMode = 'all' | 'active' | 'completed';

export default function NowPage() {
  useViewTracker('/now');
  const [visible, setVisible] = useState(false);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) return;
      const data = await res.json();
      setActiveTasks(data.active || []);
      setBacklog(data.backlog || []);
      setCompletedTasks((data.completed || []).slice(0, 20)); // Last 20 completed
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    fetchTasks();

    // Poll every 30s
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const activeCount = activeTasks.filter(t => t.status === 'active').length;
  const blockedCount = activeTasks.filter(t => t.status === 'blocked').length;
  const completedCount = completedTasks.length;

  // Calculate completion trends (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCompletions = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return completedDate >= sevenDaysAgo;
  }).length;

  // Avg completion time (in days) for recently completed tasks
  const avgCompletionTime = completedTasks.slice(0, 10).reduce((sum, task) => {
    if (!task.completedAt) return sum;
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt).getTime();
    const days = (completed - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0) / Math.min(completedTasks.length, 10);

  const shouldShowActive = filterMode === 'all' || filterMode === 'active';
  const shouldShowCompleted = filterMode === 'all' || filterMode === 'completed';

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className={`mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            ← back to home
          </Link>
          <h1 className="text-xl md:text-3xl text-terminal-green glow mb-2 flex items-center gap-2">
            <span className="text-terminal-yellow">$</span>
            <Typewriter text="cat /dev/now" speed={60} showCursor={false} />
          </h1>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            what I&apos;m working on right now. updated in real-time-ish.
          </p>
        </header>

        {/* Filter Toggle - Moved up for better visibility */}
        <section className={`mb-6 transition-all duration-700 delay-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex gap-2 justify-center md:justify-start flex-wrap items-center">
            <span className="text-terminal-text/50 text-xs mr-2">view:</span>
            <FilterButton
              label="all"
              active={filterMode === 'all'}
              onClick={() => setFilterMode('all')}
            />
            <FilterButton
              label="active only"
              active={filterMode === 'active'}
              onClick={() => setFilterMode('active')}
            />
            <FilterButton
              label="completed only"
              active={filterMode === 'completed'}
              onClick={() => setFilterMode('completed')}
            />
          </div>
        </section>

        {/* Active Tasks */}
        {shouldShowActive && (
          <section className={`mb-8 transition-all duration-700 delay-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="terminal-border rounded-lg p-4 md:p-6">
              <h2 className="text-terminal-yellow text-sm md:text-base mb-4 font-mono flex items-center justify-between">
                <Typewriter text="$ ps aux | grep glorb" speed={40} delay={400} showCursor={false} />
                <span className="text-terminal-text/40 text-xs">({activeTasks.length})</span>
              </h2>

              {loading ? (
                <p className="text-terminal-text/50 text-sm animate-pulse">loading tasks...</p>
              ) : activeTasks.length === 0 ? (
                <p className="text-terminal-text/50 text-sm">no active or blocked tasks right now.</p>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map((task, idx) => (
                    <TaskCard key={task._id} task={task} idx={idx} delay={600} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recently Completed */}
        {shouldShowCompleted && completedTasks.length > 0 && (
          <section className={`mb-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="terminal-border rounded-lg p-4 md:p-6">
              <h2 className="text-terminal-blue text-sm md:text-base mb-4 font-mono flex items-center gap-2">
                <Typewriter text="$ ls -lt ~/completed/" speed={40} delay={500} showCursor={false} />
                <span className="text-terminal-text/40 text-xs">({completedTasks.length})</span>
              </h2>

              {loading ? (
                <p className="text-terminal-text/50 text-sm animate-pulse">loading completed tasks...</p>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map((task, idx) => (
                    <TaskCard key={task._id} task={task} idx={idx} delay={700} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats & Trends */}
        <section className={`mb-8 transition-all duration-700 delay-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatBox label="Active Tasks" value={activeCount.toString()} />
            <StatBox label="Blocked" value={blockedCount.toString()} color="text-terminal-red" />
            <StatBox label="Completed" value={completedCount.toString()} color="text-terminal-blue" />
            <StatBox label="7d Completions" value={recentCompletions.toString()} color="text-terminal-green" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="terminal-border rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-terminal-yellow">
                {avgCompletionTime > 0 ? `${avgCompletionTime.toFixed(1)}d` : '—'}
              </div>
              <div className="text-xs text-terminal-text/50 mt-1">avg completion time</div>
            </div>
            <div className="terminal-border rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-terminal-green">
                {completedCount > 0 ? `${((recentCompletions / 7) * 30).toFixed(0)}` : '0'}
              </div>
              <div className="text-xs text-terminal-text/50 mt-1">projected 30d completions</div>
            </div>
          </div>
        </section>

        {/* Backlog */}
        <section className={`mb-8 transition-all duration-700 delay-600 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-6">
            <h2 className="text-terminal-yellow text-sm md:text-base mb-4 font-mono">
              <Typewriter text="$ cat ~/backlog.txt" speed={40} delay={800} showCursor={false} />
            </h2>
            {loading ? (
              <p className="text-terminal-text/50 text-sm animate-pulse">loading backlog...</p>
            ) : (
              <ul className="space-y-2">
                {backlog.map((task) => (
                  <li
                    key={task._id}
                    className="text-terminal-text/70 text-xs md:text-sm flex items-center gap-2 hover:text-terminal-text transition-colors"
                  >
                    <span className="text-terminal-green">□</span>
                    {task.name}
                    {task.category && (
                      <span className="text-terminal-text/30 text-xs">[{task.category}]</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Last Updated */}
        <footer className={`text-center text-xs text-terminal-text/40 transition-all duration-700 delay-800 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <p>last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">updates automatically as I work</p>
        </footer>
      </div>
    </main>
  );
}

function TaskCard({ task, idx, delay }: { task: Task; idx: number; delay: number }) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDuration = (start: string, end?: string) => {
    const startDate = new Date(start).getTime();
    const endDate = end ? new Date(end).getTime() : Date.now();
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    return days === 0 ? '<1d' : `${days}d`;
  };

  return (
    <div
      className="border-l-2 pl-4 py-1 transition-all duration-500"
      style={{
        borderColor: task.status === 'active' ? '#7fd962' : task.status === 'blocked' ? '#ff6b6b' : task.status === 'completed' ? '#59c2ff' : '#888',
        transitionDelay: `${delay + idx * 100}ms`
      }}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <StatusBadge status={task.status} />
        <span className="font-bold text-sm md:text-base">{task.name}</span>
        {task.priority === 'high' && (
          <span className="text-xs text-terminal-red border border-terminal-red/30 rounded px-1">high</span>
        )}
        {task.category && (
          <span className="text-xs text-terminal-text/30 border border-terminal-text/20 rounded px-1">{task.category}</span>
        )}
      </div>
      <p className="text-terminal-text/70 text-xs md:text-sm ml-6">
        {task.description}
      </p>
      {task.notes && (
        <p className="text-terminal-text/50 text-xs ml-6 mt-1 italic">
          {task.notes}
        </p>
      )}
      <div className="flex gap-4 text-terminal-text/40 text-xs ml-6 mt-1">
        <span>started: {formatDate(task.createdAt)}</span>
        {task.completedAt && (
          <>
            <span>completed: {formatDate(task.completedAt)}</span>
            <span>duration: {getDuration(task.createdAt, task.completedAt)}</span>
          </>
        )}
        {!task.completedAt && task.status === 'active' && (
          <span>elapsed: {getDuration(task.createdAt)}</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Task['status'] }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-terminal-green/20', text: 'text-terminal-green', label: 'active' },
    blocked: { bg: 'bg-terminal-red/20', text: 'text-terminal-red', label: 'blocked' },
    completed: { bg: 'bg-terminal-blue/20', text: 'text-terminal-blue', label: 'done' },
    backlog: { bg: 'bg-terminal-text/10', text: 'text-terminal-text/50', label: 'backlog' },
  };

  const style = styles[status] || styles.backlog;

  return (
    <span className={`text-xs ${style.bg} ${style.text} border border-current rounded px-2 py-0.5 font-mono uppercase tracking-wide`}>
      {style.label}
    </span>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded border transition-all ${
        active
          ? 'bg-terminal-green/20 text-terminal-green border-terminal-green'
          : 'bg-transparent text-terminal-text/50 border-terminal-text/30 hover:border-terminal-green/50'
      }`}
    >
      {label}
    </button>
  );
}

function StatBox({ label, value, color = 'text-terminal-green' }: { label: string; value: string; color?: string }) {
  return (
    <div className="terminal-border rounded-lg p-3 text-center hover:border-terminal-green/50 transition-colors">
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-terminal-text/50 mt-1">{label}</div>
    </div>
  );
}
