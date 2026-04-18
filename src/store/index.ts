import { create } from 'zustand';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createUserSlice, UserSlice } from './userSlice';

export type AppState = ChatSlice & UISlice & UserSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createChatSlice(...a),
  ...createUISlice(...a),
  ...createUserSlice(...a),
}));
