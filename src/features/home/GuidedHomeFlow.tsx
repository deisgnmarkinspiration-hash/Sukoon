import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Heart, Sparkles, Send, BookOpen, Anchor, MessageCircle, ArrowRight, Loader2, Smile, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { aiService } from '@/src/services/gemini';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { Language } from '@/src/types';

export const GuidedHomeFlow = ({ 
  lang, 
  onComplete,
  onSaveMood,
  onJournal,
  onFutureMe 
}: { 
  lang: Language, 
  onComplete: () => void,
  onSaveMood: (mood: string) => void,
  onJournal: () => void,
  onFutureMe: () => void
}) => {
  const [step, setStep] = useState<'entry' | 'calm' | 'reflect' | 'ai'>('entry');
  const [selectedMood, setSelectedMood] = useState("");
  const [reflection, setReflection] = useState("");
  const [aiResponse, setAIResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [isBreathingIn, setIsBreathingIn] = useState(true);
  const t = translations[lang];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsBreathingIn(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    onSaveMood(mood);
    setStep('calm');
  };

  const handleReflect = async (val: string) => {
    setReflection(val);
    setStep('ai');
    setLoadingAI(true);
    try {
      const resp = await aiService.getReassurance(selectedMood, val, lang);
      setAIResponse(resp.text || resp.error || "I'm here for you.");
    } catch (err) {
      setAIResponse("Take a deep breath. I'm here.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === 'entry' && (
          <motion.div 
            key="entry" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-2xl text-center space-y-12"
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight leading-tight">
              {t.feelingQuestion}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {(['overwhelmed', 'anxious', 'low', 'okay'] as const).map(m => (
                <Card 
                  key={m} 
                  onClick={() => handleMoodSelect(m)}
                  className={cn(
                    "p-10 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all active:scale-95 flex flex-col items-center gap-6 group",
                    m === 'overwhelmed' ? "bg-primary-strong text-white border-0" : "bg-white border-gray-100"
                  )}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-[32px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                    m === 'overwhelmed' ? "bg-white/20" : "bg-primary-soft/5 text-primary-soft"
                  )}>
                     <MoodIcon mood={m} className="w-10 h-10" />
                  </div>
                  <span className="font-bold text-2xl drop-shadow-sm">{t[m]}</span>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'calm' && (
          <motion.div 
            key="calm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-3xl font-serif font-bold text-gray-900 leading-snug">
                {selectedMood === 'overwhelmed' ? "Got it. Let's slow things down." : "Take a moment for yourself."}
              </h3>
              <p className="text-gray-500 font-medium">You don't have to figure everything out right now.</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.05, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-64 h-64 bg-primary-soft rounded-full blur-3xl opacity-20"
              />
              <motion.div 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 bg-white border-4 border-primary-soft/10 rounded-full flex flex-col items-center justify-center text-primary-soft shadow-xl z-10"
              >
                <div className="flex flex-col items-center">
                  <Wind className="w-10 h-10 mb-2 animate-pulse" />
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={isBreathingIn ? 'in' : 'out'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    >
                      {isBreathingIn ? "Breathe In" : "Breathe Out"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            <Button onClick={() => setStep('reflect')} className="rounded-full px-12 h-14 shadow-lg shadow-primary-soft/20">
              I feel a bit calmer now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 'reflect' && (
          <motion.div 
            key="reflect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-xl text-center space-y-10"
          >
            <h3 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">{t.heavyPrompt}</h3>
            <div className="grid grid-cols-1 gap-4">
              {(['Work / Studies', 'Relationships', 'Overthinking', 'I don\'t know'] as const).map(r => (
                <Button 
                  key={r} 
                  variant="secondary" 
                  onClick={() => handleReflect(r)}
                  className="justify-start px-8 h-14 text-lg bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-primary-soft/20 text-gray-700"
                >
                  <Sparkles className="w-5 h-5 mr-4 text-primary-soft" />
                  {r}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'ai' && (
          <motion.div 
            key="ai" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl text-center space-y-12"
          >
            <Card className="p-12 border-0 bg-white shadow-2xl space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-soft to-primary-strong" />
               {loadingAI ? (
                 <div className="py-20 flex flex-col items-center gap-6">
                    <div className="relative">
                      <Sparkles className="w-12 h-12 text-primary-soft animate-spin duration-3000" />
                      <div className="absolute inset-0 bg-primary-soft/20 blur-xl animate-pulse" />
                    </div>
                    <p className="text-gray-400 font-medium animate-pulse">Consulting the stars for a moment of peace...</p>
                 </div>
               ) : (
                 <>
                   <div className="flex justify-center">
                     <div className="w-16 h-16 bg-primary-soft/10 text-primary-soft rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8" />
                     </div>
                   </div>
                   <p className="text-2xl font-serif italic text-gray-800 leading-relaxed font-medium">"{aiResponse}"</p>
                   
                   <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Button variant="outline" onClick={onJournal} className="h-12 text-xs rounded-xl">
                       <BookOpen className="w-4 h-4 mr-2" /> Save to Journal
                     </Button>
                     <Button variant="outline" onClick={onFutureMe} className="h-12 text-xs rounded-xl">
                       <Anchor className="w-4 h-4 mr-2" /> Send to Future Me
                     </Button>
                     <Button variant="secondary" onClick={() => {}} className="h-12 text-xs rounded-xl">
                       <MessageCircle className="w-4 h-4 mr-2" /> Talk it Out
                     </Button>
                   </div>
                 </>
               )}
            </Card>
            <Button variant="ghost" onClick={onComplete} className="text-gray-400 uppercase tracking-widest text-xs">Return to Timeline</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MoodIcon = ({ mood, className }: { mood: string, className?: string }) => {
  switch (mood) {
    case 'overwhelmed': return <AlertCircle className={className} />;
    case 'anxious': return <Wind className={className} />;
    case 'low': return <Heart className={className} />;
    case 'okay': return <Smile className={className} />;
    default: return <Sparkles className={className} />;
  }
};
