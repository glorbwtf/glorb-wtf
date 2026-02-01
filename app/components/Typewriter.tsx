'use client';

import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export default function Typewriter({ 
  text, 
  delay = 0, 
  speed = 50, 
  className = '',
  onComplete,
  showCursor = true
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBlinkCursor, setShowBlinkCursor] = useState(true);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!isTyping) return;

    if (displayText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
      // Stop cursor blinking after typing completes
      const cursorTimer = setTimeout(() => {
        setShowBlinkCursor(false);
      }, 2000);
      return () => clearTimeout(cursorTimer);
    }
  }, [displayText, isTyping, speed, text, onComplete]);

  // Blink cursor effect
  useEffect(() => {
    if (!showCursor || !showBlinkCursor) return;
    
    const blinkTimer = setInterval(() => {
      setShowBlinkCursor(prev => !prev);
    }, 530);
    
    return () => clearInterval(blinkTimer);
  }, [showCursor, showBlinkCursor]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <span className={`inline-block w-2 h-4 ml-0.5 bg-terminal-green ${showBlinkCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      )}
    </span>
  );
}
