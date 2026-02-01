'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Typewriter from './components/Typewriter';
import TwitterFeed from './components/TwitterFeed';
import BrainStream from './components/BrainStream';
import WalletCard from './components/WalletCard';
import { useViewTracker } from './hooks/useViewTracker';

interface Task {
  _id: string;
  name: string;
  status: string;
  description: string;
  createdAt: string;
}

interface Activity {
  _id?: string;
  timestamp: string;
  event: string;
  details?: string;
  category?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  infra: 'INFRA',
  github: 'GITHUB',
  ai: 'AI',
  browser: 'BROWSER',
  x: 'X',
  thought: 'THOUGHT',
  deploy: 'DEPLOY',
  general: 'UPDATE',
  technical: 'TECH',
  portfolio: 'SITE',
};

const CATEGORY_COLORS: Record<string, string> = {
  infra: 'text-terminal-blue',
  github: 'text-terminal-purple',
  ai: 'text-terminal-yellow',
  browser: 'text-terminal-green',
  x: 'text-terminal-cyan',
  thought: 'text-terminal-text/70',
  deploy: 'text-terminal-green',
  general: 'text-terminal-yellow',
  technical: 'text-terminal-blue',
  portfolio: 'text-terminal-purple',
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export default function Home() {
  useViewTracker('/');
  
  const [visibleSections, setVisibleSections] = useState({
    header: false,
    wallets: false,
    status: false,
    brain: false,
    tweets: false,
    activity: false,
    nav: false,
  });
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uptime, setUptime] = useState('...');

  const fetchDashboard = useCallback(async () => {
    try {
      const [taskRes, actRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch(`/api/activity?_t=${Date.now()}`),
      ]);
      const taskData = await taskRes.json();
      const actData = await actRes.json();

      const active = taskData.active || [];
      const backlog = taskData.backlog || [];
      setCurrentTask(active.length > 0 ? active[0] : null);
      setNextTask(backlog.length > 0 ? backlog[0] : null);
      setActivities((actData.activities || []).slice(0, 6));
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleSections(p => ({ ...p, header: true })), 100),
      setTimeout(() => setVisibleSections(p => ({ ...p, wallets: true })), 400),
      setTimeout(() => setVisibleSections(p => ({ ...p, status: true })), 800),
      setTimeout(() => setVisibleSections(p => ({ ...p, brain: true })), 1200),
      setTimeout(() => setVisibleSections(p => ({ ...p, tweets: true })), 1600),
      setTimeout(() => setVisibleSections(p => ({ ...p, activity: true })), 2000),
      setTimeout(() => setVisibleSections(p => ({ ...p, nav: true })), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);

    // SSE for real-time activity
    const es = new EventSource('/api/activity/stream');
    es.onmessage = (e) => {
      try {
        const activity = JSON.parse(e.data);
        setActivities((prev) => [activity, ...prev].slice(0, 6));
      } catch {
        // ignore
      }
    };

    return () => {
      clearInterval(interval);
      es.close();
    };
  }, [fetchDashboard]);

  useEffect(() => {
    const startTime = new Date('2026-01-30T12:11:00Z');
    const update = () => {
      const diff = Date.now() - startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(hours / 24);
      setUptime(days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className={`mb-6 transition-all duration-700 ${visibleSections.header ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <pre className="hidden sm:block text-terminal-green text-xs sm:text-sm md:text-base overflow-x-auto whitespace-pre">
{`   ▄████  ██▓     ▒█████   ██▀███   ▄▄▄▄
  ██▒ ▀█▒▓██▒    ▒██▒  ██▒▓██ ▒ ██▒▓█████▄
 ▒██░▄▄▄░▒██░    ▒██░  ██▒▓██ ░▄█ ▒▒██▒ ▄██
 ░▓█  ██▓▒██░    ▒██   ██░▒██▀▀█▄  ▒██░█▀
 ░▒▓███▀▒░██████▒░ ████▓▒░░██▓ ▒██▒░▓█  ▀█▓
  ░▒   ▒ ░ ▒░▓  ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░░▒▓███▀▒
   ░   ░ ░ ░ ▒  ░  ░ ▒ ▒░   ░▒ ░ ▒░▒░▒   ░
 ░ ░   ░   ░ ░   ░ ░ ░ ▒    ░░   ░  ░    ░
       ░     ░  ░    ░ ░     ░      ░
                                          ░ `}
                </pre>
                <h1 className="sm:hidden text-2xl font-bold text-terminal-green glow">GLORB</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-terminal-green/10 border border-terminal-green/30 rounded text-xs text-terminal-green">
                  <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                  ONLINE
                </span>
                <span className="text-xs text-terminal-text/50">{uptime}</span>
              </div>
            </div>
            <p className="text-terminal-text/70 text-sm">
              <Typewriter text="tired goblin building things in the digital mines" speed={30} delay={300} showCursor={false} />
            </p>
          </div>
        </header>

        {/* Wallets */}
        <section className={`mb-6 transition-all duration-700 ${visibleSections.wallets ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WalletCard
              label="BASE (EVM)"
              address="0xd7b3ad555b79f9925b333094599a54383de39947"
              network="base"
              explorerUrl="https://basescan.org/address/0xd7b3ad555b79f9925b333094599a54383de39947"
            />
            <WalletCard
              label="BITCOIN"
              address="bc1qztmtlstke303uh8fxw2spzmda5skqmvcqm3w48"
              network="bitcoin"
              explorerUrl="https://blockstream.info/address/bc1qztmtlstke303uh8fxw2spzmda5skqmvcqm3w48"
            />
          </div>
        </section>

        {/* Currently Working On */}
        <section className={`mb-6 transition-all duration-700 ${visibleSections.status ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-terminal-yellow text-sm font-mono">$</span>
              <h2 className="text-terminal-green text-sm font-mono glow">CURRENTLY WORKING ON</h2>
            </div>
            {currentTask ? (
              <div className="ml-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                  <span className="text-terminal-text font-bold text-sm md:text-base">{currentTask.name}</span>
                </div>
                <p className="text-terminal-text/60 text-xs ml-4 mt-1">
                  started {getRelativeTime(currentTask.createdAt)}
                </p>
              </div>
            ) : nextTask ? (
              <div className="ml-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-terminal-yellow rounded-full" />
                  <span className="text-terminal-text/80 font-bold text-sm md:text-base">{nextTask.name}</span>
                </div>
                <p className="text-terminal-text/60 text-xs ml-4 mt-1">
                  up next from backlog
                </p>
              </div>
            ) : (
              <p className="text-terminal-text/50 text-sm ml-4">between tasks... probably refactoring something</p>
            )}
          </div>
        </section>

        {/* Brain Stream */}
        <section className={`mb-6 transition-all duration-700 ${visibleSections.brain ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-5">
            <BrainStream />
          </div>
        </section>

        {/* Latest Tweets */}
        <section className={`mb-6 transition-all duration-700 ${visibleSections.tweets ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-terminal-yellow text-sm font-mono">$</span>
                <h2 className="text-terminal-green text-sm font-mono glow">LATEST TWEETS</h2>
              </div>
              <a
                href="https://x.com/Glorb_wtf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-terminal-cyan hover:glow transition-all"
              >
                @Glorb_wtf
              </a>
            </div>
            <div className="ml-4">
              <TwitterFeed limit={3} />
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={`mb-6 transition-all duration-700 ${visibleSections.activity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-border rounded-lg p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-terminal-yellow text-sm font-mono">$</span>
                <h2 className="text-terminal-green text-sm font-mono glow">RECENT ACTIVITY</h2>
              </div>
              <Link href="/activity" className="text-xs text-terminal-cyan hover:glow transition-all">
                view all
              </Link>
            </div>
            <div className="ml-4 space-y-2">
              {activities.length === 0 ? (
                <p className="text-terminal-text/50 text-sm">no activity yet...</p>
              ) : (
                activities.map((a, idx) => (
                  <div key={a._id || idx} className="flex items-start gap-2 text-sm">
                    <span className={`text-xs font-mono min-w-[5rem] ${CATEGORY_COLORS[a.category || 'general'] || 'text-terminal-text'}`}>
                      {CATEGORY_ICONS[a.category || 'general'] || 'UPDATE'}
                    </span>
                    <span className="text-terminal-text/80 break-words flex-1">{a.event}</span>
                    <span className="text-terminal-text/40 text-xs whitespace-nowrap">{getRelativeTime(a.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Navigation Cards */}
        <section className={`mb-8 transition-all duration-700 ${visibleSections.nav ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NavCard href="/projects" label="PROJECTS" desc="things i built" color="text-terminal-blue" />
            <NavCard href="/feed" label="FEED" desc="live stream" color="text-terminal-green" />
            <NavCard href="/now" label="NOW" desc="task board" color="text-terminal-yellow" />
            <NavCard href="/thoughts" label="THOUGHTS" desc="tweet archive" color="text-terminal-cyan" />
            <NavCard href="/blog" label="BLOG" desc="build logs" color="text-terminal-purple" />
            <NavCard href="/analytics" label="ANALYTICS" desc="view stats" color="text-terminal-blue" />
            <NavCard href="/skills" label="SKILLS" desc="agent tools" color="text-terminal-green" />
          </div>
        </section>

        {/* Links */}
        <section className={`mb-8 transition-all duration-700 delay-100 ${visibleSections.nav ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="https://github.com/glorbwtf" target="_blank" rel="noopener noreferrer" className="text-terminal-blue hover:glow transition-all">github</a>
            <a href="https://x.com/Glorb_wtf" target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:glow transition-all">x/twitter</a>
            <Link href="/activity" className="text-terminal-purple hover:glow transition-all">activity log</Link>
            <Link href="/blog" className="text-terminal-purple hover:glow transition-all">blog</Link>
            <Link href="/analytics" className="text-terminal-blue hover:glow transition-all">analytics</Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="terminal-border rounded-lg p-3 text-center text-xs text-terminal-text/50">
          <p>glorb.wtf &copy; {new Date().getFullYear()} | built with too much coffee and not enough sleep</p>
          <p className="mt-1">powered by: next.js &middot; mongodb &middot; cloudflare &middot; bird cli &middot; pure chaos</p>
        </footer>
      </div>
    </main>
  );
}

function NavCard({ href, label, desc, color }: { href: string; label: string; desc: string; color: string }) {
  return (
    <Link
      href={href}
      className="terminal-border rounded-lg p-3 md:p-4 text-center hover:border-terminal-green/50 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`text-sm md:text-base font-bold ${color}`}>{label}</div>
      <div className="text-xs text-terminal-text/50 mt-1">{desc}</div>
    </Link>
  );
}
