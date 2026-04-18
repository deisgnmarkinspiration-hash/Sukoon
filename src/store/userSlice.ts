import { StateCreator } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, MoodEntry, JournalEntry, WallOfHopeMessage, FutureMeMessage } from '@/src/types';
import { AppState } from './index';

export interface UserSlice {
  user: User | null;
  profile: UserProfile | null;
  moods: MoodEntry[];
  journalEntries: JournalEntry[];
  wallMessages: WallOfHopeMessage[];
  futureMeMessages: FutureMeMessage[];
  
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setMoods: (moods: MoodEntry[]) => void;
  setJournalEntries: (entries: JournalEntry[]) => void;
  setWallMessages: (messages: WallOfHopeMessage[]) => void;
  setFutureMeMessages: (messages: FutureMeMessage[]) => void;
}

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => ({
  user: null,
  profile: null,
  moods: [],
  journalEntries: [],
  wallMessages: [],
  futureMeMessages: [],
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setMoods: (moods) => set({ moods }),
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  setWallMessages: (wallMessages) => set({ wallMessages }),
  setFutureMeMessages: (futureMeMessages) => set({ futureMeMessages }),
});
