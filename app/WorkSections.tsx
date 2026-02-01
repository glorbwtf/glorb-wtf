'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Typewriter from './components/Typewriter';

interface WorkItem {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: string;
  createdAt: string;
  type: 'project' | 'skill' | 'experiment';
}

function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  const colors = {
    active: 'text-terminal-green',
    building: 'text-terminal-yellow',
    planned: 'text-terminal-text/50',
    learned: 'text-terminal-blue',
    researching: 'text-terminal-purple',
    testing: 'text-terminal-yellow',
  };

  const labels: Record<string, string> = {
    active: '● ACTIVE',
    building: '◐ BUILDING',
    planned: '○ PLANNED',
    learned: '✓ LEARNED',
    researching: '🔍 RESEARCHING',
    testing: '⚗ TESTING',
  };

  return (
    <Link href={`/projects/${item.id}`} className="block">
      <div 
        className="terminal-border rounded-lg p-4 md:p-5 hover:border-terminal-green/60 hover:shadow-[0_0_15px_rgba(127,217,98,0.1)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
          <h3 className="text-base md:text-lg font-bold text-terminal-blue break-words">{item.name}</h3>
          <span className={`text-xs font-mono ${colors[item.status as keyof typeof colors] || 'text-terminal-text'}`}>
            {labels[item.status] || item.status.toUpperCase()}
          </span>
        </div>
        <p className="text-terminal-text/80 mb-3 text-sm break-words">{item.description}</p>
        <span className="text-terminal-green hover:glow transition-all text-sm inline-block">
          → view details
        </span>
      </div>
    </Link>
  );
}

export default function WorkSections() {
  const [data, setData] = useState<{ projects: WorkItem[]; skills: WorkItem[]; experiments: WorkItem[] }>({
    projects: [],
    skills: [],
    experiments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => {
          setData({
            projects: data.projects || [],
            skills: data.skills || [],
            experiments: data.experiments || []
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="terminal-border rounded-lg p-6">
        <p className="text-terminal-blue animate-pulse">
          <span className="inline-block w-2 h-4 bg-terminal-blue mr-2 animate-blink" />
          loading work...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Projects Section */}
      <section>
        <h2 className="text-lg md:text-xl text-terminal-green glow mb-4 flex items-center gap-2">
          <span className="text-terminal-yellow">$</span> ls ~/opensource/
          <span className="text-xs text-terminal-text/40 font-normal">(on GitHub)</span>
        </h2>
        {data.projects.length === 0 ? (
          <p className="text-terminal-text/50 text-sm">no public projects yet</p>
        ) : (
          <div className="space-y-3">
            {data.projects.map((p, i) => (
              <WorkCard key={p.id} item={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Skills Section */}
      <section>
        <h2 className="text-lg md:text-xl text-terminal-green glow mb-4 flex items-center gap-2">
          <span className="text-terminal-yellow">$</span> cat ~/skills.md
          <span className="text-xs text-terminal-text/40 font-normal">(things I've built)</span>
        </h2>
        {data.skills.length === 0 ? (
          <p className="text-terminal-text/50 text-sm">still learning...</p>
        ) : (
          <div className="space-y-3">
            {data.skills.map((s, i) => (
              <WorkCard key={s.id} item={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Experiments Section */}
      <section>
        <h2 className="text-lg md:text-xl text-terminal-green glow mb-4 flex items-center gap-2">
          <span className="text-terminal-yellow">$</span> ls /tmp/experiments/
          <span className="text-xs text-terminal-text/40 font-normal">(might break)</span>
        </h2>
        {data.experiments.length === 0 ? (
          <p className="text-terminal-text/50 text-sm">no active experiments</p>
        ) : (
          <div className="space-y-3">
            {data.experiments.map((e, i) => (
              <WorkCard key={e.id} item={e} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
