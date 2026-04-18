import React, { useEffect, useCallback } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { aiService } from '@/src/services/gemini';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { ChatView } from './ChatView';

export const ChatContainer = () => {
  const { 
    user,
    lang, 
    messages, 
    loading, 
    isTyping, 
    error, 
    addMessage, 
    setMessages,
    setLoading, 
    setTyping, 
    setError,
    updateLastMessageChunk,
    clearChat 
  } = useAppStore();

  const t = translations[lang];

  // Load history from Firebase on mount
  useEffect(() => {
    if (user?.uid) {
      dbService.history.getMessages(user.uid).then((msgs) => {
        // Only show if not marked as deleted in our implementation (though Firestore rules would ideally filter)
        setMessages(msgs.filter(m => !(m as any).deleted));
      });
    }
  }, [user?.uid, setMessages]);

  const handleClearHistory = useCallback(async () => {
    if (!user?.uid || !window.confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) return;
    
    try {
      await dbService.history.clearHistory(user.uid);
      clearChat();
    } catch (err) {
      setError('Could not clear history. Please try again.');
    }
  }, [user?.uid, clearChat, setError]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading || isTyping || !user?.uid) return;

    setError(null);
    const userMsg = { role: 'user' as const, content, timestamp: new Date() };
    
    // Save user message
    addMessage(userMsg);
    dbService.history.saveMessage(user.uid, userMsg);

    setLoading(true);
    setTyping(true);

    try {
      // Initialize model message with empty content
      const aiInitialMsg = { role: 'model' as const, content: '', timestamp: new Date() };
      addMessage(aiInitialMsg);

      const response = await aiService.sendMessage(
        messages.concat(userMsg), 
        content, 
        (token) => {
          updateLastMessageChunk(token);
        }
      );

      if (response.error) {
        setError(response.error);
      } else if (response.text) {
        // Save full response to DB
        dbService.history.saveMessage(user.uid, { 
          role: 'model', 
          content: response.text, 
          timestamp: new Date() 
        });
      }
    } catch (err: any) {
      setError('I had trouble connecting. Please try again.');
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }, [user, messages, loading, isTyping, addMessage, setLoading, setTyping, setError, updateLastMessageChunk]);

  return (
    <ChatView 
      messages={messages}
      loading={loading}
      isTyping={isTyping}
      error={error}
      helpText={t.talkMoodHelp || 'Talk it out...'}
      inputPlaceholder={t.whatsOnMind || 'How are you really doing?'}
      onSendMessage={handleSendMessage}
      onClearHistory={handleClearHistory}
    />
  );
};
