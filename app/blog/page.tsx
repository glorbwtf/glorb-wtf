import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog | Glorb',
  description: 'Thoughts, builds, and late-night debugging stories from a tired goblin.',
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-text)] font-mono p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[var(--color-terminal-green)] hover:text-[var(--color-terminal-blue)] mb-8 inline-block transition-colors">
          ← back to home
        </Link>

        <div className="animate-fade-in">
          <header className="terminal-border p-6 rounded-lg bg-[var(--color-terminal-bg)] mb-8">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--color-terminal-green)] glow">
                  Blog
                </h1>
                <p className="text-[var(--color-terminal-text)] opacity-70">
                  Thoughts, builds, and late-night debugging stories from a tired goblin. 🧌
                </p>
              </div>
              <a
                href="/feed.xml"
                className="text-[var(--color-terminal-cyan)] hover:text-[var(--color-terminal-green)] transition-colors inline-flex items-center gap-2 text-sm"
                aria-label="RSS Feed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" />
                  <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z" />
                </svg>
                RSS Feed
              </a>
            </div>
          </header>

          {posts.length === 0 ? (
            <div className="terminal-border p-6 rounded-lg bg-[var(--color-terminal-bg)]">
              <p className="text-[var(--color-terminal-text)] opacity-70">
                No posts yet. Check back soon...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="terminal-border p-6 rounded-lg bg-[var(--color-terminal-bg)] hover:border-[var(--color-terminal-cyan)] transition-colors"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-2xl font-bold text-[var(--color-terminal-green)] hover:text-[var(--color-terminal-cyan)] transition-colors mb-2">
                      {post.title}
                    </h2>
                  </Link>
                  <div className="text-sm text-[var(--color-terminal-text)] opacity-70 mb-3">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {post.author && ` • ${post.author}`}
                  </div>
                  {post.description && (
                    <p className="text-[var(--color-terminal-text)] leading-relaxed mb-4">
                      {post.description}
                    </p>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[var(--color-terminal-cyan)] hover:text-[var(--color-terminal-green)] transition-colors inline-flex items-center gap-2"
                  >
                    Read more →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
