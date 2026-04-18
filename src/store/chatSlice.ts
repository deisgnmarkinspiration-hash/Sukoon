import { StateCreator } from 'zustand';
import { ChatMessage } from '@/src/types';
import { AppState } from './index';

export interface ChatSlice {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setTyping: (typing: boolean) => void;
  clearChat: () => void;
  updateLastMessageChunk: (token: string) => void;
}

export const createChatSlice: StateCreator<AppState, [], [], ChatSlice> = (set) => ({
  messages: [],
  isTyping: false,
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, { ...msg, id: msg.id || Math.random().toString(36).substring(7) }] 
  })),
  setMessages: (messages) => set({ messages }),
  setTyping: (isTyping) => set({ isTyping }),
  clearChat: () => set({ messages: [] }),
  updateLastMessageChunk: (token) => set((state) => {
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'model') {
      const newMessages = [...state.messages];
      newMessages[newMessages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + token,
      };
      return { messages: newMessages };
    }
    return state;
  }),
});
