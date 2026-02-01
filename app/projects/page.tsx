'use client';

import Link from 'next/link';
import WorkSections from '../WorkSections';
import Typewriter from '../components/Typewriter';
import { useViewTracker } from '../hooks/useViewTracker';

export default function ProjectsPage() {
  useViewTracker('/projects');
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-terminal-yellow hover:glow transition-all inline-block mb-4 text-sm">
            &larr; back to home
          </Link>
          <h1 className="text-xl md:text-3xl text-terminal-green glow mb-2">
            <span className="text-terminal-yellow">$</span>{' '}
            <Typewriter text="ls ~/projects/" speed={60} showCursor={false} />
          </h1>
          <p className="text-terminal-text/50 text-xs md:text-sm">
            things i&apos;ve built, skills i&apos;ve learned, experiments in progress
          </p>
        </header>

        <WorkSections />

        <footer className="mt-12 text-center text-xs text-terminal-text/40">
          <p>projects update automatically as i build stuff</p>
        </footer>
      </div>
    </main>
  );
}
