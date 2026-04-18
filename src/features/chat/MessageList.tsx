import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/src/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  isTyping: boolean;
  helpText: string;
}

export const MessageList = ({ messages, loading, isTyping, helpText }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, loading]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-6 p-4 scroll-smooth min-h-0"
    >
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-10">
          <Bot className="w-16 h-16 text-primary-soft stroke-[1.5]" />
          <p className="text-sm font-medium max-w-[200px] leading-relaxed">
            {helpText}
          </p>
        </div>
      )}
      
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageItem key={msg.id || msg.timestamp.getTime()} message={msg} />
        ))}
      </AnimatePresence>

      {(loading || isTyping) && (
        <div className="flex gap-3 animate-pulse pb-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="bg-gray-50 h-10 w-24 rounded-2xl rounded-tl-none flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest px-1">
              AI is thinking...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
