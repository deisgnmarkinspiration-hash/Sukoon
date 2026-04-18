import { Timestamp } from 'firebase/firestore';

export type Language = 'en' | 'hi' | 'ur';

export type Mood = 'calm' | 'anxious' | 'stressed' | 'sad' | 'neutral' | 'happy';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  preferredLanguage: Language;
  onboardingComplete: boolean;
  createdAt: any;
  silentMode?: boolean;
}

export interface MoodEntry {
  id?: string;
  uid: string;
  timestamp: any;
  mood: Mood;
  note?: string;
  intensity?: number;
}

export interface JournalEntry {
  id?: string;
  uid: string;
  timestamp: any;
  content: string;
  title?: string;
  sentiment?: string;
  tags?: string[];
}

export interface FutureMeMessage {
  id?: string;
  uid: string;
  type: 'text' | 'audio' | 'video';
  content: string;
  tags: string[];
  prompt?: string;
  createdAt: any;
}

export interface WallOfHopeMessage {
  id?: string;
  text: string;
  authorLang: string;
  createdAt: any;
  likes: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
