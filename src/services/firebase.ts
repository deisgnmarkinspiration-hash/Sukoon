import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { 
  getFirestore, 
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
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';
import { MoodEntry, JournalEntry, UserProfile, WallOfHopeMessage, FutureMeMessage } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

export const services = {
  auth: {
    loginWithGoogle: () => signInWithPopup(auth, googleProvider),
    logout: () => auth.signOut(),
    getUserProfile: async (uid: string) => {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as UserProfile) : null;
    },
    createUserProfile: async (profile: UserProfile) => {
      await setDoc(doc(db, 'users', profile.uid), {
        ...profile,
        createdAt: serverTimestamp()
      });
    }
  },

  moods: {
    save: async (entry: Omit<MoodEntry, 'id'>) => {
      return addDoc(collection(db, 'moods'), {
        ...entry,
        timestamp: serverTimestamp()
      });
    },
    subscribe: (uid: string, callback: (moods: MoodEntry[]) => void) => {
      const q = query(
        collection(db, 'moods'),
        where('uid', '==', uid)
      );
      return onSnapshot(q, (snap) => {
        const moods = snap.docs.map(d => ({ id: d.id, ...d.data() } as MoodEntry));
        // Sort client-side to avoid mandatory composite index
        moods.sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
        callback(moods.slice(0, 50));
      });
    }
  },

  journal: {
    save: async (entry: Omit<JournalEntry, 'id'>) => {
      return addDoc(collection(db, 'journal'), {
        ...entry,
        timestamp: serverTimestamp()
      });
    },
    subscribe: (uid: string, callback: (entries: JournalEntry[]) => void) => {
      const q = query(
        collection(db, 'journal'),
        where('uid', '==', uid)
      );
      return onSnapshot(q, (snap) => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
        // Sort client-side to avoid mandatory composite index
        entries.sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
        callback(entries.slice(0, 50));
      });
    }
  },

  wall: {
    post: async (text: string, lang: string) => {
      return addDoc(collection(db, 'wallOfHope'), {
        text,
        authorLang: lang,
        likes: 0,
        createdAt: serverTimestamp()
      });
    },
    subscribe: (callback: (messages: WallOfHopeMessage[]) => void) => {
      const q = query(collection(db, 'wallOfHope'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WallOfHopeMessage));
        callback(msgs);
      });
    },
    like: async (id: string, currentLikes: number) => {
      await updateDoc(doc(db, 'wallOfHope', id), { likes: currentLikes + 1 });
    }
  },

  futureMe: {
    subscribe: (uid: string, callback: (messages: FutureMeMessage[]) => void) => {
      const q = query(
        collection(db, 'futureMeMessages'),
        where('uid', '==', uid)
      );
      return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FutureMeMessage));
        // Sort client-side to avoid mandatory composite index
        msgs.sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        });
        callback(msgs);
      });
    }
  }
};
