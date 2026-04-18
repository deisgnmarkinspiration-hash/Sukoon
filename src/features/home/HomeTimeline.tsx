import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Smile, BookOpen, Calendar, ShieldAlert, Wind, Settings, Play, X, Filter, SortDesc, SortAsc } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { GuidedHomeFlow } from './GuidedHomeFlow';
import { MoodEntry, JournalEntry, FutureMeMessage, Mood } from '@/src/types';

export const HomeTimeline = ({ onSOS, setView }: { onSOS: () => void, setView: (v: any) => void }) => {
  const { lang, moods, journalEntries, sukoonMode, user, profile } = useAppStore();
  const [flowActive, setFlowActive] = useState(false);
  const [initialMood, setInitialMood] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'mood' | 'journal'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [editingMood, setEditingMood] = useState<MoodEntry | null>(null);
  const [editNote, setEditNote] = useState('');
  const t = translations[lang];

  const handleStartFlow = (mood: string) => {
    setInitialMood(mood);
    setFlowActive(true);
  };

  const handleSaveMoodDirectly = React.useCallback(async (mood: string) => {
    if (!user) return;
    const moodValue = 
      mood === 'okay' ? 'neutral' : 
      mood === 'low' ? 'sad' : 
      mood as Mood;

    await dbService.moods.save({
      uid: user.uid,
      mood: moodValue,
      intensity: 5,
      timestamp: new Date()
    });
  }, [user]);

  const timeline = useMemo(() => {
    let items = [
      ...moods.map(m => ({ ...m, type: 'mood' as const })),
      ...journalEntries.map(j => ({ ...j, type: 'journal' as const }))
    ];

    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }

    return items.sort((a, b) => {
      const tA = (a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.()) || new Date(0);
      const tB = (b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.()) || new Date(0);
      return sortOrder === 'desc' ? tB.getTime() - tA.getTime() : tA.getTime() - tB.getTime();
    });
  }, [moods, journalEntries, filterType, sortOrder]);

  const handleUpdateMood = async () => {
    if (!editingMood || !user) return;
    try {
      await dbService.moods.update(editingMood.id, { note: editNote });
      // To reflect changes immediately since Zustand doesn't auto-sync single fields out of the box we might need a store update
      // But we can trigger a re-fetch or just update local store if we exported an action.
      // Assuming realtime listeners are active in useAppInitialization, this will update automatically.
      setEditingMood(null);
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="space-y-16 pb-20">
      <AnimatePresence mode="wait">
        {!flowActive ? (
          <motion.div 
            key="home-main" exit={{ opacity: 0 }}
            className="space-y-16"
          >
            {/* Step 1: Entry */}
            <div className="text-center space-y-12 pt-8">
              <div className="space-y-4">
                <h2 className={cn(
                  "text-sm font-bold uppercase tracking-widest",
                  sukoonMode ? "text-primary-strong/60" : "text-primary-soft"
                )}>
                  Salaam, {profile?.displayName?.split(' ')[0]}
                </h2>
                <h1 className={cn(
                  "text-5xl md:text-6xl font-serif font-bold tracking-tight leading-tight transition-colors duration-1000",
                  sukoonMode ? "text-slate-100" : "text-gray-900"
                )}>
                  {t.feelingQuestion}
                </h1>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto px-4">
                {(['stressed', 'anxious', 'low', 'okay'] as const).map(m => (
                  <Card 
                    key={m} 
                    onClick={() => handleStartFlow(m)}
                    className={cn(
                      "p-4 sm:p-10 cursor-pointer transition-all active:scale-95 flex flex-col items-center gap-3 sm:gap-6 group hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden",
                      sukoonMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-gray-50 hover:border-primary-soft/20 text-gray-900"
                    )}
                  >
                    {!sukoonIcon(m) && <SparklesBackground />}
                    <div className={cn(
                      "w-14 h-14 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[32px] flex items-center justify-center transition-all duration-500 shadow-inner z-10",
                      m === 'stressed' ? "bg-rose-50 text-rose-500" : 
                      m === 'anxious' ? "bg-amber-50 text-amber-500" :
                      m === 'low' ? "bg-indigo-50 text-indigo-500" :
                      "bg-emerald-50 text-emerald-500"
                    )}>
                       {sukoonIcon(m)}
                    </div>
                    <span className="font-bold text-base sm:text-2xl z-10">{t[m]}</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Timeline Section */}
            {timeline.length > 0 && (
              <div className="space-y-10 pt-16 border-t border-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 gap-4">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Your Journey</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{timeline.length} Entries</p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <div className="flex bg-gray-50 rounded-full p-1">
                        <button onClick={() => setFilterType('all')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filterType === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}>All</button>
                        <button onClick={() => setFilterType('mood')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filterType === 'mood' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}>Moods</button>
                        <button onClick={() => setFilterType('journal')} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filterType === 'journal' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}>Journals</button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} className="text-gray-500 rounded-full w-9 h-9">
                        {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                      </Button>
                   </div>
                </div>
                
                <div className="space-y-8 relative before:absolute before:left-[15px] before:top-4 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-primary-soft/20 before:to-transparent mx-4 pb-4">
                  {timeline.map((item, i) => (
                    <motion.div 
                      key={item.id || i} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="relative pl-12"
                    >
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-2xl flex items-center justify-center z-10 shadow-lg",
                        item.type === 'mood' ? "bg-pastel-green text-primary-soft shadow-emerald-100" : "bg-primary-soft text-white shadow-primary-100"
                      )}>
                         {item.type === 'mood' ? <Smile className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1 opacity-70">
                           {format(item.timestamp instanceof Date ? item.timestamp : (item.timestamp as any)?.toDate() || new Date(), 'HH:mm • MMM d')}
                         </p>
                         <Card 
                            onClick={item.type === 'mood' ? () => { setEditingMood(item as MoodEntry); setEditNote((item as MoodEntry).note || ""); } : undefined}
                            className={cn("p-6 border-0 shadow-sm bg-white hover:shadow-xl transition-all duration-500 group", item.type === 'mood' && "cursor-pointer hover:-translate-y-0.5")}
                         >
                            {item.type === 'mood' ? (
                               <div className="flex items-center gap-4">
                                 <div className="text-3xl">{(item as MoodEntry).mood === 'happy' ? '✨' : (item as MoodEntry).mood === 'sad' ? '💧' : '🌱'}</div>
                                 <div className="flex-1">
                                    <span className="text-lg font-bold text-gray-800 tracking-tight block">Feeling {(item as MoodEntry).mood}</span>
                                    {(item as MoodEntry).note && <p className="text-sm text-gray-500 mt-1 italic">"{(item as MoodEntry).note}"</p>}
                                    <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit details</p>
                                 </div>
                               </div>
                            ) : (
                               <div className="space-y-3">
                                  <p className="text-base text-gray-600 line-clamp-3 leading-relaxed">{(item as JournalEntry).content}</p>
                                  <div className="flex gap-2">
                                     {['Personal', 'Reflection'].map(tag => (
                                       <span key={tag} className="text-[10px] bg-gray-50 text-gray-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">#{tag}</span>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </Card>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <GuidedHomeFlow 
            lang={lang}
            initialMood={initialMood}
            onComplete={() => {
              setFlowActive(false);
              setInitialMood(null);
            }}
            onSaveMood={handleSaveMoodDirectly}
            onJournal={() => setView('journal')}
            onFutureMe={() => setView('futureMe')}
            onChat={() => setView('chat')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm"
            >
              <Card className="p-6 border-0 shadow-2xl relative overflow-hidden bg-white">
                <button 
                  onClick={() => setEditingMood(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-2"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-bold text-gray-900">Edit Mood Details</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                      {format(editingMood.timestamp instanceof Date ? editingMood.timestamp : (editingMood.timestamp as any)?.toDate() || new Date(), 'MMM d, yyyy • HH:mm')}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
                     <div className="text-4xl text-center w-12">{editingMood.mood === 'happy' ? '✨' : editingMood.mood === 'sad' ? '💧' : '🌱'}</div>
                     <p className="font-bold text-lg text-gray-800 capitalize">Feeling {editingMood.mood}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Journal Note</label>
                    <textarea 
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      placeholder="Add reflections about this feeling..."
                      className="w-full border-2 border-gray-100 rounded-2xl p-4 min-h-[120px] focus:ring-0 focus:border-primary-soft outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setEditingMood(null)} className="flex-1 rounded-xl">Cancel</Button>
                    <Button onClick={handleUpdateMood} className="flex-1 rounded-xl">Save Changes</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SparklesBackground = () => (
   <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
      {[...Array(6)].map((_, i) => (
        <motion.div 
          key={i}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i }}
          className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
          style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }}
        />
      ))}
   </div>
);

const sukoonIcon = (mood: string) => {
  switch (mood) {
    case 'stressed': return <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />;
    case 'anxious': return <Wind className="w-8 h-8 sm:w-10 sm:h-10" />;
    case 'low': return <Smile className="w-8 h-8 sm:w-10 sm:h-10" />;
    case 'okay': return <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />;
    default: return null;
  }
}

const Sparkles = ({ className }: { className?: string }) => <Wind className={className} />;
