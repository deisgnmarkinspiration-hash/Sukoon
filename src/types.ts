export type Mood = "calm" | "anxious" | "stressed" | "sad" | "neutral" | "happy";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  preferredLanguage: "en" | "hi" | "ur";
  onboardingComplete: boolean;
  createdAt: Date;
  silentMode?: boolean;
}

export interface MemoryEntry {
  id?: string;
  uid: string;
  patternName: string;
  observation: string;
  frequency: number;
  lastTriggered: any; // Firestore timestamp
  type: 'trigger' | 'strength' | 'insight';
}

export interface Intervention {
  id: string;
  title: string;
  type: 'grounding' | 'reframing' | 'stabilizer';
  steps: { text: string; duration: number }[];
  tone: 'calm' | 'firm' | 'neutral';
}

export interface DecisionSession {
  id?: string;
  uid: string;
  problem: string;
  analysis: {
    prosCons: { text: string; weight: number }[];
    fearVsLogic: { fear: string; logic: string }[];
    futureProjection: string;
  };
  createdAt: any; // Firestore timestamp
}

export interface MoodEntry {
  id?: string;
  uid: string;
  timestamp: Date;
  mood: Mood;
  note?: string;
  intensity: number;
}

export interface JournalEntry {
  id?: string;
  uid: string;
  timestamp: Date;
  content: string;
  title?: string;
  sentiment?: string;
}

export interface Goal {
  id?: string;
  uid: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly";
  completedDates: string[]; // ISO date strings
  createdAt: Date;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface FutureMeMessage {
  id?: string;
  uid: string;
  type: 'text' | 'audio' | 'video';
  content: string; // Text content or base64 data for audio/video
  tags: string[]; // e.g., ['anxiety', 'panic', 'sadness', 'anger']
  prompt?: string; // The prompt that guided the creation
  createdAt: any; // Firestore timestamp
}
