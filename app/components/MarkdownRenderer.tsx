'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown parser - handles common elements
  const parseMarkdown = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-4 list-disc list-inside text-[var(--color-terminal-text)]">
            {listItems.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="bg-[var(--color-terminal-bg)] border border-[var(--color-terminal-green)] p-4 rounded my-4 overflow-x-auto">
              <code className="text-[var(--color-terminal-green)] text-sm">{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-xl font-bold text-[var(--color-terminal-cyan)] mt-6 mb-3">
            {line.substring(4)}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-2xl font-bold text-[var(--color-terminal-green)] mt-8 mb-4">
            {line.substring(3)}
          </h2>
        );
        return;
      }

      // Lists
      if (line.match(/^[-*]\s+/)) {
        if (!inList) inList = true;
        listItems.push(line.replace(/^[-*]\s+/, ''));
        return;
      } else if (inList && line.trim() === '') {
        flushList();
        return;
      } else if (inList) {
        flushList();
      }

      // Horizontal rule
      if (line.match(/^---$/)) {
        elements.push(
          <hr key={idx} className="border-[var(--color-terminal-green)] my-6" />
        );
        return;
      }

      // Paragraphs
      if (line.trim()) {
        elements.push(
          <p
            key={idx}
            className="text-[var(--color-terminal-text)] leading-relaxed my-4"
            dangerouslySetInnerHTML={{ __html: parseInline(line) }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  const parseInline = (text: string) => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--color-terminal-cyan)] font-bold">$1</strong>');
    
    // Inline code
    text = text.replace(/`(.+?)`/g, '<code class="text-[var(--color-terminal-green)] bg-[var(--color-terminal-bg)] px-1 py-0.5 rounded">$1</code>');
    
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--color-terminal-cyan)] hover:text-[var(--color-terminal-green)] underline transition-colors">$1</a>');
    
    return text;
  };

  return <div className="space-y-4">{parseMarkdown(content)}</div>;
}
