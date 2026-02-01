'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Nav items that match actual page sections
const navItems = [
  { id: 'header', label: 'home', icon: '🏠' },
  { id: 'work', label: 'work', icon: '💼' },
  { id: 'activity', label: 'log', icon: '📝', href: '/activity' },
  { id: 'blog', label: 'blog', icon: '📖', href: '/blog/how-i-built-glorb-wtf' },
];

export default function MobileNav() {
  const [activeSection, setActiveSection] = useState('header');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActivityPage = pathname === '/activity';

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll position and progress
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    
    setScrollProgress(progress);
    setIsVisible(scrollY > 100);
    setIsAtBottom(progress > 90);
  }, []);

  // Track active section
  useEffect(() => {
    if (!isMobile || isActivityPage) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0,
    });

    // Observe sections
    navItems.forEach((item) => {
      if (item.href) return; // Skip external links
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [isMobile, isActivityPage, handleScroll]);

  const handleNavClick = (item: typeof navItems[0]) => {
    // Haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (item.href) {
      router.push(item.href);
    } else {
      const element = document.getElementById(item.id);
      if (element) {
        const offset = 60;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  };

  // On activity page, highlight "log" tab
  useEffect(() => {
    if (isActivityPage) {
      setActiveSection('activity');
    }
  }, [isActivityPage]);

  if (!isMobile) return null;

  return (
    <>
      {/* Progress bar at top */}
      <div 
        className={`fixed top-0 left-0 h-0.5 bg-terminal-green z-50 transition-all duration-150 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Main floating nav bar */}
      <nav
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          isVisible || isActivityPage
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-terminal-bg/95 backdrop-blur-xl border border-terminal-green/30 rounded-2xl shadow-lg shadow-terminal-green/10 px-1.5 py-1.5 flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id || (isActivityPage && item.id === 'activity');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`relative px-3 py-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-0.5 min-w-[3.5rem] active:scale-95 ${
                  isActive
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'text-terminal-text/50 hover:text-terminal-text hover:bg-terminal-text/5'
                }`}
                aria-label={`Go to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-lg transition-transform duration-200">{item.icon}</span>
                <span className={`text-[10px] font-mono uppercase tracking-wider transition-all ${
                  isActive ? 'font-semibold text-terminal-green' : ''
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-4 h-0.5 bg-terminal-green rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Scroll to top button - shows when scrolled down */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (navigator.vibrate) navigator.vibrate(10);
        }}
        className={`fixed bottom-20 right-4 z-50 w-10 h-10 bg-terminal-bg border border-terminal-green/50 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
          isVisible && !isAtBottom
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-10 opacity-0 scale-75 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg
          className="w-4 h-4 text-terminal-green"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>

      {/* Quick action button at bottom - shows only when at bottom */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (navigator.vibrate) navigator.vibrate(10);
        }}
        className={`fixed bottom-4 right-4 z-50 w-12 h-12 bg-terminal-green/90 rounded-full flex items-center justify-center shadow-lg shadow-terminal-green/20 transition-all duration-300 active:scale-90 ${
          isAtBottom
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-20 opacity-0 scale-75 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <svg
          className="w-5 h-5 text-terminal-bg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </>
  );
}
