import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { cn, formatTime } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { useAppStore } from '@/src/store/useAppStore';
import { geminiService } from '@/src/services/gemini';
import { translations } from '@/src/translations';

export const GeminiChat = () => {
  const { lang, chatHistory, addChatMessage, loading, setLoading, error, setError } = useAppStore();
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMsg, timestamp: new Date() });
    setLoading(true);
    setError(null);

    const history = chatHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const response = await geminiService.chat(history, userMsg, lang);

    if (response.error) {
      setError(response.error);
    } else {
      addChatMessage({ role: 'model', content: response.text, timestamp: new Date() });
    }
    setLoading(false);
  };

  return (
    <Card className="flex flex-col h-[600px] border-0 bg-transparent">
      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 p-4 scroll-smooth"
      >
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <Bot className="w-12 h-12 text-primary-soft" />
            <p className="text-sm font-medium">{t.talkMoodHelp}</p>
          </div>
        )}
        
        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full mb-4",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[80%] gap-3",
                msg.role === 'user' ? "flex-row-reverse text-right" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user' ? "bg-primary-strong text-white" : "bg-white border border-gray-100 text-primary-soft"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary-strong text-white rounded-tr-none shadow-sm" 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
            </div>
            <div className="bg-gray-50 h-10 w-32 rounded-3xl rounded-tl-none" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-500 text-xs rounded-2xl text-center border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white/50 border-t border-gray-50 rounded-b-[40px]">
        <div className="flex gap-2 relative">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.whatsOnMind}
            disabled={loading}
            className="flex-1 h-14 pr-16 bg-white shadow-inner border-gray-100"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || loading}
            size="icon"
            className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </form>
    </Card>
  );
};
