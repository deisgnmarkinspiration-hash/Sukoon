import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppStore } from '../store/useAppStore';
import { services, auth } from '../services/firebase';

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch/Sync profile
        const profile = await services.auth.getUserProfile(user.uid);
        setProfile(profile);

        // Subscriptions
        const unsubMoods = services.moods.subscribe(user.uid, setMoods);
        const unsubJournal = services.journal.subscribe(user.uid, setJournalEntries);
        const unsubFutureMe = services.futureMe.subscribe(user.uid, setFutureMeMessages);
        
        return () => {
          unsubMoods();
          unsubJournal();
          unsubFutureMe();
        };
      } else {
        setProfile(null);
        setMoods([]);
        setJournalEntries([]);
        setFutureMeMessages([]);
      }
      setLoading(false);
    });

    // Global subscriptions
    const unsubWall = services.wall.subscribe(setWallMessages);

    return () => {
      unsubscribeAuth();
      unsubWall();
    };
  }, []);
}
