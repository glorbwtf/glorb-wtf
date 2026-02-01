'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useViewTracker } from '../../hooks/useViewTracker';

interface ProjectDetail {
  _id: string;
  id: string;
  name: string;
  description: string;
  url?: string;
  status: string;
  createdAt: string;
  type: 'project' | 'skill' | 'experiment';
  longDescription?: string;
  technologies?: string[];
  challenges?: string[];
  learnings?: string[];
  links?: { label: string; url: string }[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  useViewTracker(`/projects/${id}`);
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/projects/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="terminal-border rounded-lg p-6">
            <p className="text-terminal-blue animate-pulse">
              <span className="inline-block w-2 h-4 bg-terminal-blue mr-2 animate-blink" />
              loading project...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/projects" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            &larr; back to projects
          </Link>
          <div className="terminal-border rounded-lg p-6">
            <p className="text-terminal-red">
              <span className="text-terminal-yellow">$</span> cat ~/projects/{id}.md
            </p>
            <p className="text-terminal-red mt-2">cat: {id}.md: No such file or directory</p>
            <p className="text-terminal-text/50 text-sm mt-4">
              Project not found. Maybe it got deleted or never existed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const statusColors = {
    active: 'text-terminal-green',
    building: 'text-terminal-yellow',
    planned: 'text-terminal-text/50',
    learned: 'text-terminal-blue',
    researching: 'text-terminal-purple',
    testing: 'text-terminal-yellow',
  };

  const statusLabels: Record<string, string> = {
    active: '● ACTIVE',
    building: '◐ BUILDING',
    planned: '○ PLANNED',
    learned: '✓ LEARNED',
    researching: '🔍 RESEARCHING',
    testing: '⚗ TESTING',
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/projects" className="text-terminal-yellow hover:glow transition-all inline-block mb-6 text-sm">
          &larr; back to projects
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <h1 className="text-2xl md:text-4xl text-terminal-green glow break-words">
              {project.name}
            </h1>
            <span className={`text-xs font-mono ${statusColors[project.status as keyof typeof statusColors] || 'text-terminal-text'} whitespace-nowrap`}>
              {statusLabels[project.status] || project.status.toUpperCase()}
            </span>
          </div>
          <p className="text-terminal-text text-base md:text-lg mb-4 break-words">{project.description}</p>
          {project.url && (
            <a 
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-blue hover:glow transition-all inline-block break-all"
            >
              → {project.url}
            </a>
          )}
        </header>

        {/* Long Description */}
        {project.longDescription && (
          <section className="terminal-border rounded-lg p-4 md:p-6 mb-6">
            <h2 className="text-terminal-yellow text-lg mb-3">
              <span className="text-terminal-green">$</span> cat README.md
            </h2>
            <div className="text-terminal-text/90 text-sm md:text-base whitespace-pre-wrap break-words">
              {project.longDescription}
            </div>
          </section>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <section className="terminal-border rounded-lg p-4 md:p-6 mb-6">
            <h2 className="text-terminal-yellow text-lg mb-3">
              <span className="text-terminal-green">$</span> cat package.json
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <span 
                  key={i} 
                  className="text-xs md:text-sm bg-terminal-green/10 text-terminal-green px-3 py-1 rounded border border-terminal-green/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Challenges */}
        {project.challenges && project.challenges.length > 0 && (
          <section className="terminal-border rounded-lg p-4 md:p-6 mb-6">
            <h2 className="text-terminal-yellow text-lg mb-3">
              <span className="text-terminal-green">$</span> cat CHALLENGES.md
            </h2>
            <ul className="space-y-2 text-terminal-text/80 text-sm md:text-base">
              {project.challenges.map((challenge, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-terminal-red">•</span>
                  <span className="break-words">{challenge}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Learnings */}
        {project.learnings && project.learnings.length > 0 && (
          <section className="terminal-border rounded-lg p-4 md:p-6 mb-6">
            <h2 className="text-terminal-yellow text-lg mb-3">
              <span className="text-terminal-green">$</span> cat LEARNINGS.md
            </h2>
            <ul className="space-y-2 text-terminal-text/80 text-sm md:text-base">
              {project.learnings.map((learning, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-terminal-green">✓</span>
                  <span className="break-words">{learning}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Additional Links */}
        {project.links && project.links.length > 0 && (
          <section className="terminal-border rounded-lg p-4 md:p-6">
            <h2 className="text-terminal-yellow text-lg mb-3">
              <span className="text-terminal-green">$</span> cat LINKS.md
            </h2>
            <ul className="space-y-2">
              {project.links.map((link, i) => (
                <li key={i}>
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-blue hover:glow transition-all break-all"
                  >
                    → {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Timestamp */}
        <footer className="mt-8 text-xs text-terminal-text/40 text-center">
          Created {new Date(project.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </footer>
      </div>
    </main>
  );
}
