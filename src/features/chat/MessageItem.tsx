import React from 'react';
import { motion } from 'motion/react';
import { Bot, User } from 'lucide-react';
import { cn, formatTime } from '@/src/lib/utils';
import { ChatMessage } from '@/src/types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem = React.memo(({ message }: MessageItemProps) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] gap-3",
        isUser ? "flex-row-reverse text-right" : "flex-row"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
          isUser ? "bg-primary-strong text-white" : "bg-white border border-gray-100 text-primary-soft"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div className="space-y-1">
          <div className={cn(
            "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-colors",
            isUser 
              ? "bg-primary-strong text-white rounded-tr-none shadow-sm" 
              : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm"
          )}>
            {message.content}
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';
