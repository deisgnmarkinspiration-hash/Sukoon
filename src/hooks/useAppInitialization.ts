import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppStore } from '../store/useAppStore';
import { auth } from '../lib/firebase';
import { dbService } from '../services/firebase';

/**
 * Hook to handle initial app synchronization with Firebase.
 */
export function useAppInitialization() {
  const { 
    setUser, 
    setProfile, 
    setLoading, 
    setMoods, 
    setJournalEntries, 
    setWallMessages, 
    setFutureMeMessages 
  } = useAppStore();

  useEffect(() => {
    let subUnsubs: (() => void)[] = [];

    const cleanupSubs = () => {
      subUnsubs.forEach(unsub => unsub());
      subUnsubs = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      cleanupSubs();
      
      if (user) {
        try {
          // Fetch/Sync profile
          const profile = await dbService.auth.getUserProfile(user.uid);
          setProfile(profile);

          // Subscriptions
          subUnsubs.push(dbService.moods.subscribe(user.uid, setMoods));
          subUnsubs.push(dbService.journal.subscribe(user.uid, setJournalEntries));
          subUnsubs.push(dbService.futureMe.subscribe(user.uid, setFutureMeMessages));
        } catch (e) {
          console.error('Initialization Error:', e);
        }
      } else {
        setProfile(null);
        setMoods([]);
        setJournalEntries([]);
        setFutureMeMessages([]);
      }
      setLoading(false);
    });

    // Global subscriptions
    const unsubWall = dbService.wall.subscribe(setWallMessages);

    return () => {
      unsubscribeAuth();
      unsubWall();
      cleanupSubs();
    };
  }, []);
}
