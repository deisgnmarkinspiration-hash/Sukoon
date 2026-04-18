import { Trash2 } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { ChatMessage } from '@/src/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  isTyping: boolean;
  error: string | null;
  helpText: string;
  inputPlaceholder: string;
  onSendMessage: (msg: string) => void;
  onClearHistory?: () => void;
}

export const ChatView = ({ 
  messages, 
  loading, 
  isTyping, 
  error, 
  helpText, 
  inputPlaceholder, 
  onSendMessage,
  onClearHistory 
}: ChatViewProps) => {
  return (
    <Card className="flex flex-col h-[calc(100dvh-180px)] md:h-[650px] border-0 bg-transparent relative overflow-hidden group">
      {/* Header with Privacy Action */}
      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Secure conversation</h3>
        {messages.length > 0 && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClearHistory}
            className="h-6 px-3 rounded-full text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear history
          </Button>
        )}
      </div>

      <MessageList 
        messages={messages} 
        loading={loading} 
        isTyping={isTyping} 
        helpText={helpText} 
      />
      
      {error && (
        <div className="absolute bottom-20 left-4 right-4 animate-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <div className="p-3 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-2xl text-center border border-red-100 shadow-xl pointer-events-auto">
            {error}
          </div>
        </div>
      )}

      <ChatInput 
        onSendMessage={onSendMessage} 
        disabled={loading || isTyping} 
        placeholder={inputPlaceholder} 
      />
    </Card>
  );
};
