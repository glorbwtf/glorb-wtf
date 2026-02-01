import { useEffect } from 'react';

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('glorb_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('glorb_session_id', sessionId);
  }
  return sessionId;
}

export function useViewTracker(pageName: string) {
  useEffect(() => {
    const sessionId = getSessionId();
    const startTime = Date.now();

    // Track page view on mount
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pageName,
        referrer: document.referrer || null,
        sessionId,
        duration: 0, // Initial view
      }),
    }).catch(() => {
      // silently fail
    });

    // Track duration on unmount
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000); // seconds
      
      // Use sendBeacon for reliable tracking on page unload
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ page: pageName, sessionId, duration })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/views', blob);
      } else {
        fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pageName,
            sessionId,
            duration,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [pageName]);
}
