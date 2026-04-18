import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { 
  MoodEntry, 
  JournalEntry, 
  UserProfile, 
  WallOfHopeMessage, 
  FutureMeMessage,
  ChatMessage 
} from '../types';

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || '',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || true,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

const googleProvider = new GoogleAuthProvider();

export const dbService = {
  auth: {
    loginWithGoogle: () => signInWithPopup(auth, googleProvider),
    logout: () => auth.signOut(),
    getUserProfile: async (uid: string) => {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        return snap.exists() ? (snap.data() as UserProfile) : null;
      } catch (e) {
        return handleFirestoreError(e, 'get', `users/${uid}`);
      }
    },
    createUserProfile: async (profile: UserProfile) => {
      try {
        await setDoc(doc(db, 'users', profile.uid), {
          ...profile,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, 'create', `users/${profile.uid}`);
      }
    }
  },

  moods: {
    save: async (entry: Omit<MoodEntry, 'id'>) => {
      try {
        return await addDoc(collection(db, 'moods'), {
          ...entry,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'moods');
      }
    },
    subscribe: (uid: string, callback: (moods: MoodEntry[]) => void) => {
      const q = query(collection(db, 'moods'), where('uid', '==', uid));
      return onSnapshot(q, 
        (snap) => {
          const moods = snap.docs.map(d => ({ id: d.id, ...d.data() } as MoodEntry));
          moods.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          callback(moods.slice(0, 50));
        },
        (error) => handleFirestoreError(error, 'list', 'moods')
      );
    }
  },

  history: {
    saveMessage: async (uid: string, msg: Omit<ChatMessage, 'id'>) => {
      try {
        return await addDoc(collection(db, 'users', uid, 'chat'), {
          ...msg,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, 'create', `users/${uid}/chat`);
      }
    },
    getMessages: async (uid: string): Promise<ChatMessage[]> => {
      try {
        const q = query(collection(db, 'users', uid, 'chat'), orderBy('timestamp', 'asc'), limit(100));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(), 
          timestamp: d.data().timestamp?.toDate() || new Date() 
        } as ChatMessage));
      } catch (e) {
        return handleFirestoreError(e, 'list', `users/${uid}/chat`);
      }
    },
    clearHistory: async (uid: string) => {
        // Simple strategy: user would delete their chat collection
        // In Firestore, we have to delete docs one by one or via batch
        const q = query(collection(db, 'users', uid, 'chat'));
        const snap = await getDocs(q);
        // This is a production risk if history is huge, but we limit to 100 for now
        for (const d of snap.docs) {
            await updateDoc(d.ref, { deleted: true }); // better than actual delete for safety in this demo
        }
    }
  },

  journal: {
    save: async (entry: Omit<JournalEntry, 'id'>) => {
      try {
        return await addDoc(collection(db, 'journal'), {
          ...entry,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'journal');
      }
    },
    subscribe: (uid: string, callback: (entries: JournalEntry[]) => void) => {
      const q = query(collection(db, 'journal'), where('uid', '==', uid));
      return onSnapshot(q, 
        (snap) => {
          const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
          entries.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          callback(entries.slice(0, 50));
        },
        (error) => handleFirestoreError(error, 'list', 'journal')
      );
    }
  },

  wall: {
    post: async (text: string, lang: string) => {
      try {
        return await addDoc(collection(db, 'wallOfHope'), {
          text,
          authorLang: lang,
          likes: 0,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, 'create', 'wallOfHope');
      }
    },
    subscribe: (callback: (messages: WallOfHopeMessage[]) => void) => {
      const q = query(collection(db, 'wallOfHope'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, 
        (snap) => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WallOfHopeMessage));
          callback(msgs);
        },
        (error) => handleFirestoreError(error, 'list', 'wallOfHope')
      );
    },
    like: async (id: string, currentLikes: number) => {
      try {
        await updateDoc(doc(db, 'wallOfHope', id), { likes: currentLikes + 1 });
      } catch (e) {
        handleFirestoreError(e, 'update', `wallOfHope/${id}`);
      }
    }
  },

  futureMe: {
    subscribe: (uid: string, callback: (messages: FutureMeMessage[]) => void) => {
      const q = query(collection(db, 'futureMeMessages'), where('uid', '==', uid));
      return onSnapshot(q, 
        (snap) => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FutureMeMessage));
          msgs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          callback(msgs);
        },
        (error) => handleFirestoreError(error, 'list', 'futureMeMessages')
      );
    }
  }
};
