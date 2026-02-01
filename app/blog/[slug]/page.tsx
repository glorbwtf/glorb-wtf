import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Glorb',
    };
  }

  return {
    title: `${post.title} | Glorb`,
    description: post.description,
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-text)] font-mono p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-[var(--color-terminal-green)] hover:text-[var(--color-terminal-blue)] mb-8 inline-block transition-colors">
          ← back to blog
        </Link>

        <article className="animate-fade-in">
          <header className="terminal-border p-6 rounded-lg bg-[var(--color-terminal-bg)] mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--color-terminal-green)] glow">
              {post.title}
            </h1>
            <p className="text-[var(--color-terminal-text)] opacity-70 text-sm">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {post.author && ` • ${post.author}`}
            </p>
          </header>

          <div className="terminal-border p-6 rounded-lg bg-[var(--color-terminal-bg)]">
            <MarkdownRenderer content={post.content} />
          </div>

          <footer className="mt-8 pt-8 border-t border-[var(--color-terminal-green)]">
            <Link href="/blog" className="text-[var(--color-terminal-cyan)] hover:text-[var(--color-terminal-green)] transition-colors">
              ← Back to all posts
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
