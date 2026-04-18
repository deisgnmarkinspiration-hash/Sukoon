import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Smile, BookOpen, Calendar, ShieldAlert, Wind, Anchor, Settings, Play } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { services } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { GuidedHomeFlow } from './GuidedHomeFlow';
import { MoodEntry, JournalEntry, FutureMeMessage, Mood } from '@/src/types';

export const HomeTimeline = ({ onSOS, setView }: { onSOS: () => void, setView: (v: any) => void }) => {
  const { lang, moods, journalEntries, futureMeMessages, user, profile } = useAppStore();
  const [flowActive, setFlowActive] = useState(false);
  const t = translations[lang];

  const handleSaveMoodDirectly = async (mood: string) => {
    if (!user) return;
    const moodValue = mood === 'overwhelmed' ? 'stressed' : mood === 'okay' ? 'neutral' : mood as Mood;
    await services.moods.save({
      uid: user.uid,
      mood: moodValue,
      intensity: 5,
      timestamp: new Date()
    });
  };

  const timeline = [
    ...moods.map(m => ({ ...m, type: 'mood' as const })),
    ...journalEntries.map(j => ({ ...j, type: 'journal' as const }))
  ].sort((a, b) => {
    const tA = (a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.()) || new Date(0);
    const tB = (b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.()) || new Date(0);
    return tB.getTime() - tA.getTime();
  });

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <AnimatePresence mode="wait">
        {!flowActive ? (
          <motion.div 
            key="home-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-16"
          >
            {/* Step 1: Entry */}
            <div className="text-center space-y-12 pt-8">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-primary-soft uppercase tracking-widest">Salaam, {profile?.displayName?.split(' ')[0]}</h2>
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight leading-tight">
                  {t.feelingQuestion}
                </h1>
              </div>
              
              <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto px-4">
                {(['overwhelmed', 'anxious', 'low', 'okay'] as const).map(m => (
                  <Card 
                    key={m} 
                    onClick={() => setFlowActive(true)}
                    className={cn(
                      "p-12 cursor-pointer transition-all active:scale-95 flex flex-col items-center gap-6 group hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden",
                      m === 'overwhelmed' ? "bg-primary-strong text-white border-0 shadow-xl shadow-primary-soft/20" : "bg-white border-gray-100"
                    )}
                  >
                    {!sukoonIcon(m) && <SparklesBackground />}
                    <div className={cn(
                      "w-20 h-20 rounded-[32px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner z-10",
                      m === 'overwhelmed' ? "bg-white/20" : "bg-primary-soft/5 text-primary-soft"
                    )}>
                       {sukoonIcon(m)}
                    </div>
                    <span className="font-bold text-2xl z-10">{t[m]}</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Timeline Section */}
            {timeline.length > 0 && (
              <div className="space-y-10 pt-16 border-t border-gray-50">
                <div className="flex items-center justify-between px-4">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Your Journey</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.appPreferences} • {t.home}</p>
                   </div>
                   <Button variant="secondary" size="sm" onClick={() => setView('journal')} className="rounded-full text-[10px] px-6">View Entire Journal</Button>
                </div>
                
                <div className="space-y-8 relative before:absolute before:left-[15px] before:top-4 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-primary-soft/20 before:to-transparent mx-4">
                  {timeline.slice(0, 5).map((item, i) => (
                    <motion.div 
                      key={i} 
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
                         <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-xl transition-all duration-500 group">
                            {item.type === 'mood' ? (
                               <div className="flex items-center gap-4">
                                 <div className="text-3xl">{(item as MoodEntry).mood === 'happy' ? '✨' : (item as MoodEntry).mood === 'sad' ? '💧' : '🌱'}</div>
                                 <div className="flex-1">
                                    <span className="text-lg font-bold text-gray-800 tracking-tight block">Feeling {(item as MoodEntry).mood}</span>
                                    {(item as MoodEntry).note && <p className="text-sm text-gray-500 mt-1 italic">"{(item as MoodEntry).note}"</p>}
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
            onComplete={() => setFlowActive(false)}
            onSaveMood={handleSaveMoodDirectly}
            onJournal={() => setView('journal')}
            onFutureMe={() => setView('futureMe')}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Bar / Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pt-16 border-t border-gray-50">
          <ToolCard onClick={onSOS} icon={<ShieldAlert className="text-primary-strong" />} label={t.sos} color="primary" />
          <ToolCard onClick={() => setView('calm')} icon={<Wind className="text-emerald-500" />} label={t.calm} color="emerald" />
          <ToolCard onClick={() => setView('futureMe')} icon={<Anchor className="text-blue-500" />} label={t.futureMe} color="blue" />
          <ToolCard onClick={() => setView('settings')} icon={<Settings className="text-gray-500" />} label={t.settings} color="gray" />
      </div>
    </div>
  );
};

const ToolCard = ({ onClick, icon, label, color }: { onClick: () => void, icon: any, label: string, color: string }) => {
  const colors: Record<string, string> = {
    primary: "hover:bg-primary-strong group-hover:text-white",
    emerald: "hover:bg-emerald-500",
    blue: "hover:bg-blue-500",
    gray: "hover:bg-gray-800"
  };

  return (
    <Card onClick={onClick} variant="outline" className={cn(
      "p-6 flex flex-col items-center gap-3 transition-all cursor-pointer group hover:scale-[1.05] hover:shadow-xl",
      colors[color]
    )}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-white/20 group-hover:rotate-12 transition-all")}>
         {icon}
      </div>
      <span className="text-[10px] uppercase font-bold tracking-[0.2em] group-hover:text-white transition-colors">{label}</span>
    </Card>
  );
}

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
    case 'overwhelmed': return <ShieldAlert className="w-10 h-10" />;
    case 'anxious': return <Wind className="w-10 h-10" />;
    case 'low': return <Smile className="w-10 h-10" />;
    case 'okay': return <Sparkles className="w-10 h-10" />;
    default: return null;
  }
}

const Sparkles = ({ className }: { className?: string }) => <Wind className={className} />;
