import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, Language, MoodEntry, JournalEntry, WallOfHopeMessage, FutureMeMessage, ChatMessage } from '@/src/types';

interface AppState {
  // Auth & Session
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // App Config
  lang: Language;
  sukoonMode: boolean;
  
  // Data
  moods: MoodEntry[];
  journalEntries: JournalEntry[];
  wallMessages: WallOfHopeMessage[];
  futureMeMessages: FutureMeMessage[];
  chatHistory: ChatMessage[];
  
  // Setters
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLang: (lang: Language) => void;
  setSukoonMode: (mode: boolean) => void;
  
  // Data Setters (for subscriptions)
  setMoods: (moods: MoodEntry[]) => void;
  setJournalEntries: (entries: JournalEntry[]) => void;
  setWallMessages: (messages: WallOfHopeMessage[]) => void;
  setFutureMeMessages: (messages: FutureMeMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  
  lang: 'en',
  sukoonMode: false,
  
  moods: [],
  journalEntries: [],
  wallMessages: [],
  futureMeMessages: [],
  chatHistory: [],
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLang: (lang) => set({ lang }),
  setSukoonMode: (mode) => set({ sukoonMode: mode }),
  
  setMoods: (moods) => set({ moods }),
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  setWallMessages: (wallMessages) => set({ wallMessages }),
  setFutureMeMessages: (futureMeMessages) => set({ futureMeMessages }),
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChatHistory: () => set({ chatHistory: [] }),
}));
