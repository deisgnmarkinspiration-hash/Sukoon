import { StateCreator } from 'zustand';
import { Language } from '@/src/types';
import { AppState } from './index';

export interface UISlice {
  initializing: boolean;
  loading: boolean;
  error: string | null;
  lang: Language;
  sukoonMode: boolean;
  setInitializing: (initializing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLang: (lang: Language) => void;
  setSukoonMode: (mode: boolean) => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  initializing: true,
  loading: false,
  error: null,
  lang: 'en',
  sukoonMode: false,
  setInitializing: (initializing) => set({ initializing }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLang: (lang) => set({ lang }),
  setSukoonMode: (mode) => set({ sukoonMode: mode }),
});
