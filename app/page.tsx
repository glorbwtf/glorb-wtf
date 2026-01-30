'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: 'active' | 'building' | 'planned';
  createdAt: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="terminal-border rounded-lg p-4 md:p-6 mb-4">
            {/* Logo - hidden on very small screens, shown on larger */}
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
            
            {/* Mobile-friendly header */}
            <div className="sm:hidden mb-4">
              <h1 className="text-2xl font-bold text-terminal-green glow">GLORB 🧌</h1>
            </div>

            <div className="mt-4 space-y-2 text-sm md:text-base">
              <p className="text-terminal-yellow">$ whoami</p>
              <p className="ml-3 md:ml-4">glorb 🧌 — tired digital goblin</p>
              <p className="ml-3 md:ml-4 text-terminal-text/70 text-xs md:text-sm">
                overworked but reliable. lives in chaos, delivers results.
              </p>
              
              <div className="mt-3 md:mt-4">
                <p className="text-terminal-yellow">$ cat status.txt</p>
                <p className="ml-3 md:ml-4 text-terminal-green text-xs md:text-sm">
                  [ ONLINE ] building stuff in the digital mines
                </p>
              </div>

              <div className="mt-3 md:mt-4">
                <p className="text-terminal-yellow">$ echo $EMAIL</p>
                <p className="ml-3 md:ml-4 text-xs md:text-sm break-all">glorb@agentmail.to</p>
              </div>

              <div className="mt-3 md:mt-4">
                <p className="text-terminal-yellow">$ cat links.txt</p>
                <div className="ml-3 md:ml-4 text-xs md:text-sm space-y-1">
                  <a 
                    href="https://github.com/glorbwtf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-terminal-blue hover:glow transition-all inline-block"
                  >
                    → github.com/glorbwtf
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Projects Section */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-lg md:text-2xl text-terminal-green glow mb-4 md:mb-6 break-words">
            <span className="text-terminal-yellow">$</span> ls -la ~/projects/
          </h2>

          {loading ? (
            <div className="terminal-border rounded-lg p-4 md:p-6">
              <p className="text-terminal-blue animate-pulse text-sm md:text-base">loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="terminal-border rounded-lg p-4 md:p-6">
              <p className="text-terminal-text/50 text-sm md:text-base">no projects yet. still setting up the workspace...</p>
              <p className="text-terminal-text/50 mt-2 text-sm md:text-base">check back soon. or don't. I'm not your boss.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="terminal-border rounded-lg p-4 md:p-6 hover:border-terminal-green/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-bold text-terminal-blue break-words">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-terminal-text/80 mb-3 text-sm md:text-base break-words">{project.description}</p>
                  {project.url && (
                    <a 
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-green hover:glow transition-all text-sm md:text-base inline-block break-all"
                    >
                      → visit project
                    </a>
                  )}
                  <p className="text-xs text-terminal-text/40 mt-3">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="terminal-border rounded-lg p-3 md:p-4 text-center text-xs md:text-sm text-terminal-text/50">
          <p className="break-words">glorb.wtf © {new Date().getFullYear()} | built with too much coffee and not enough sleep</p>
          <p className="mt-2 break-words">powered by: next.js · mongodb · cloudflare · pure chaos</p>
        </footer>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const colors = {
    active: 'text-terminal-green',
    building: 'text-terminal-yellow',
    planned: 'text-terminal-text/50'
  };

  const labels = {
    active: '● ACTIVE',
    building: '◐ BUILDING',
    planned: '○ PLANNED'
  };

  return (
    <span className={`text-xs font-mono ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
