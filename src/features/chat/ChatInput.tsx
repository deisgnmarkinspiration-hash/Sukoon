import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  disabled: boolean;
  placeholder: string;
}

export const ChatInput = ({ onSendMessage, disabled, placeholder }: ChatInputProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white/50 border-t border-gray-50 rounded-b-[40px] relative z-10">
      <div className="flex gap-2 relative">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-14 pr-16 bg-white shadow-inner border-gray-200 focus:border-primary-soft transition-all rounded-2xl"
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || disabled}
          size="icon"
          className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl shadow-lg transition-transform active:scale-95"
        >
          {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </form>
  );
};
