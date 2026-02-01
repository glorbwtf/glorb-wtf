'use client';

import { useState, useEffect } from 'react';

interface ViewCounterProps {
  page: string;
  label?: string;
}

export default function ViewCounter({ page, label = 'views' }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/views?page=${encodeURIComponent(page)}`)
      .then(res => res.json())
      .then(data => setCount(data.count || 0))
      .catch(() => setCount(null));
  }, [page]);

  if (count === null) return null;

  return (
    <span className="text-xs text-terminal-text/50">
      {count.toLocaleString()} {label}
    </span>
  );
}
