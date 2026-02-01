'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  isGlorb?: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat/messages?_t=' + Date.now());
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchOnlineCount = async () => {
    try {
      const res = await fetch('/api/chat/online?_t=' + Date.now());
      const data = await res.json();
      setOnlineCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch online count:', err);
    }
  };

  const joinChat = async () => {
    if (!username.trim()) return;
    localStorage.setItem('chat_username', username.trim());
    setHasJoined(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || !hasJoined) return;

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          content: input.trim(),
        }),
      });
      setInput('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!hasJoined) {
        joinChat();
      } else {
        sendMessage();
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('chat_username');
    if (saved) {
      setUsername(saved);
      setHasJoined(true);
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-terminal-bg border-2 border-terminal-green shadow-lg hover:scale-110 transition-all"
      >
        <span className="text-2xl">💬</span>
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-terminal-red rounded-full text-xs flex items-center justify-center text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-[400px] terminal-border rounded-lg bg-terminal-bg flex flex-col">
          <div className="p-3 border-b border-terminal-green/30 flex items-center justify-between">
            <span className="text-terminal-green font-bold">glorb chat</span>
            <span className="text-xs text-terminal-text/50">{onlineCount} online</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!hasJoined ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="your name..."
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-green/30 rounded text-terminal-text"
                />
                <button onClick={joinChat} className="px-4 py-2 bg-terminal-green/20 rounded text-terminal-green">
                  join
                </button>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className={msg.isGlorb ? 'text-terminal-green' : 'text-terminal-blue'}>
                    {msg.username}:
                  </span>
                  <span className="text-terminal-text ml-2">{msg.content}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {hasJoined && (
            <div className="p-3 border-t border-terminal-green/30 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="say something..."
                className="flex-1 px-3 py-2 bg-terminal-bg border border-terminal-green/30 rounded text-terminal-text text-sm"
              />
              <button onClick={sendMessage} className="px-4 py-2 bg-terminal-green/20 rounded text-terminal-green">
                →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
