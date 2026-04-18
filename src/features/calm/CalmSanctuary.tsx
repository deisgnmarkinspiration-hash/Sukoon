import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, CloudMoon, Waves, Cloud as CloudIcon, CloudRain, Zap, Heart, User as UserIcon, Loader2, Sparkles, MessageCircle, Play, Square } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/store/useAppStore';
import { dbService } from '@/src/services/firebase';
import { translations } from '@/src/translations';
import { format } from 'date-fns';

const THEMES = {
  ocean: { 
    o1: 'bg-cyan-300/30', 
    o2: 'bg-indigo-400/20', 
    o3: 'bg-emerald-500/20', 
    d: { d1: 30, d2: 35, d3: 40 },
    name: 'Serene Ocean'
  },
  forest: { 
    o1: 'bg-emerald-200/40', 
    o2: 'bg-yellow-200/20', 
    o3: 'bg-teal-600/15', 
    d: { d1: 45, d2: 50, d3: 55 },
    name: 'Morning Forest'
  },
  nebula: { 
    o1: 'bg-fuchsia-500/20', 
    o2: 'bg-violet-400/15', 
    o3: 'bg-indigo-700/20', 
    d: { d1: 20, d2: 25, d3: 30 },
    name: 'Deep Space'
  },
  sunset: {
    o1: 'bg-orange-300/30',
    o2: 'bg-rose-400/20',
    o3: 'bg-amber-500/15',
    d: { d1: 35, d2: 40, d3: 45 },
    name: 'Golden Hour'
  }
};

const EnhancedBackground = ({ sukoonMode, theme }: { sukoonMode: boolean, theme: keyof typeof THEMES }) => {
  const t = THEMES[theme];
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <motion.div 
        animate={{ x: [0, 150, -50, 0], y: [0, 80, 120, 0], scale: [1, 1.4, 0.8, 1] }}
        transition={{ duration: t.d.d1, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[150px] transition-colors duration-1000", sukoonMode ? "bg-slate-900/50" : t.o1)}
      />
      <motion.div 
        animate={{ x: [0, -180, 80, 0], y: [0, 100, -60, 0], scale: [1, 1.5, 1.2, 1] }}
        transition={{ duration: t.d.d2, repeat: Infinity, delay: 5, ease: "easeInOut" }}
        className={cn("absolute top-[20%] -right-[15%] w-[65%] h-[65%] rounded-full blur-[130px] transition-colors duration-1000", sukoonMode ? "bg-slate-800/80" : t.o2)}
      />
      <motion.div 
        animate={{ x: [0, 120, -150, 0], y: [0, -150, 70, 0], scale: [1, 1.2, 1.4, 1] }}
        transition={{ duration: t.d.d3, repeat: Infinity, delay: 10, ease: "easeInOut" }}
        className={cn("absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000", sukoonMode ? "bg-purple-900/40" : t.o3)}
      />
    </div>
  );
};

const Soundscapes = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const tracks = [
    { id: 'white', title: "Zen Static", yt: "nMfPqeZjc2c", icon: <CloudIcon className="w-6 h-6" /> },
    { id: 'rain', title: "Twilight Rain", yt: "mPZkdNFkNps", icon: <CloudRain className="w-6 h-6" /> },
    { id: 'ocean', title: "Ebb & Flow", yt: "f77SKdyn-1Y", icon: <Waves className="w-6 h-6" /> },
    { id: 'birds', title: "Secret Forest", yt: "eKFTSSKCzWA", icon: <Wind className="w-6 h-6" /> }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tracks.map(track => (
        <Card 
          key={track.id}
          className={cn(
            "group overflow-hidden transition-all duration-500 relative",
            playingId === track.id ? "ring-2 ring-primary-soft shadow-2xl scale-[1.02]" : "hover:shadow-xl hover:-translate-y-1",
            sukoonMode && "bg-slate-900 border-slate-800"
          )}
        >
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                  playingId === track.id ? "bg-primary-strong text-white" : "bg-primary-soft/5 text-primary-soft shadow-inner"
                )}>
                  {track.icon}
                </div>
                <h3 className="font-bold text-xl tracking-tight">{track.title}</h3>
              </div>
              <Button
                variant={playingId === track.id ? 'primary' : 'secondary'}
                size="icon"
                onClick={() => setPlayingId(playingId === track.id ? null : track.id)}
                className="rounded-full w-12 h-12"
              >
                {playingId === track.id ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
              </Button>
            </div>

            <div className={cn(
              "aspect-video rounded-3xl bg-black overflow-hidden transition-all duration-700",
              playingId === track.id ? "opacity-100 max-h-[300px]" : "opacity-0 max-h-0"
            )}>
              {playingId === track.id && (
                <iframe 
                   src={`https://www.youtube.com/embed/${track.yt}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${track.yt}`}
                   className="w-full h-full opacity-60"
                   allow="autoplay"
                />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const WallOfHope = ({ messages, sukoonMode, lang }: { messages: any[], sukoonMode: boolean, lang: any }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('sukoon_liked_messages');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handlePost = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    await dbService.wall.post(input.trim(), lang);
    setInput('');
    setLoading(false);
  };

  const handleLike = (id: string, currentLikes: number) => {
    if (likedMessageIds.has(id)) return; // Prevent double liking
    dbService.wall.like(id, currentLikes || 0);
    setLikedMessageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      localStorage.setItem('sukoon_liked_messages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <Card className={cn("p-10 border-0 shadow-2xl shadow-primary-soft/10 overflow-hidden relative", sukoonMode ? "bg-slate-900" : "bg-white")}>
        {!sukoonMode && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-primary-soft to-indigo-400" />}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold">The Wall of Hope</h3>
            <p className="text-gray-400 text-sm italic">"Your words might be exactly what someone else needs to hear today."</p>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share a thought, a hope, or a tiny win..."
            className={cn(
              "w-full rounded-[24px] p-6 text-lg border-0 focus:ring-4 transition-all min-h-[140px]",
              sukoonMode ? "bg-slate-800 text-slate-200 focus:ring-slate-700" : "bg-gray-50 focus:ring-primary-soft/10 placeholder:text-gray-300"
            )}
          />
          <Button onClick={handlePost} disabled={!input.trim() || loading} className="w-full h-14 rounded-2xl text-base shadow-lg shadow-primary-soft/10">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Anonymously Share Hope"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
        {messages.map((m, i) => {
          const hasLiked = likedMessageIds.has(m.id!);
          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={cn(
                "p-8 rounded-[40px] border shadow-sm transition-all relative overflow-hidden group",
                sukoonMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 hover:shadow-2xl"
              )}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", sukoonMode ? "bg-slate-800" : "bg-primary-soft/10")}>
                  <UserIcon className={cn("w-5 h-5", sukoonMode ? "text-slate-500" : "text-primary-soft")} />
                </div>
                <div className="flex-1">
                  <p className={cn("font-bold", sukoonMode ? "text-slate-100" : "text-gray-900")}>Kind Stranger</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                      {m.authorLang} • {format(m.createdAt?.toDate?.() || new Date(), 'MMM d')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xl font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed pl-2 mb-8 border-l-2 border-primary-soft/20 py-1">
                "{m.text}"
              </p>
              <div className="flex justify-start">
                 <button 
                  onClick={() => handleLike(m.id!, m.likes || 0)}
                  disabled={hasLiked}
                  className={cn(
                    "flex items-center gap-2 group/btn font-bold text-sm text-gray-400 transition-colors px-4 py-2 rounded-full",
                    hasLiked ? "bg-red-50/50 dark:bg-red-900/10 cursor-default" : "hover:text-red-500 bg-gray-50 dark:bg-slate-800 cursor-pointer"
                  )}
                 >
                   <Heart className={cn("w-4 h-4 transition-transform", hasLiked ? "text-red-500 fill-current" : "group-active/btn:scale-125", (m.likes > 0 && !hasLiked) && "text-red-400")} />
                   <span className={cn(hasLiked && "text-red-500")}>{m.likes || 0}</span>
                 </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const DistractTasks = ({ sukoonMode }: { sukoonMode: boolean }) => {
  const [task, setTask] = useState<'rhythm' | 'facts' | 'none'>('none');
  const [count, setCount] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  
  const facts = [
    "A day on Venus is longer than its year.",
    "Wombats have cube-shaped poop.",
    "Octopuses have three hearts and blue blood.",
    "The Eiffel Tower can grow 15cm in summer.",
    "Honey never spoils. archaeologists found 3000-year-old honey that is edible."
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-[400px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {task === 'none' ? (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl mx-auto">
            <Card 
              onClick={() => { setTask('rhythm'); setCount(0); }}
              className={cn("p-10 cursor-pointer text-center group transition-all h-[240px] flex flex-col items-center justify-center gap-4", sukoonMode ? "bg-slate-900 border-slate-800" : "hover:border-primary-soft/30 hover:shadow-2xl")}
            >
              <div className="w-16 h-16 rounded-full bg-primary-soft/10 text-primary-soft flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 rounded-full bg-current" />
              </div>
              <p className="font-serif font-bold text-lg">Tap Rhythm</p>
              <span className="text-xs text-gray-400">Ground yourself with steady taps</span>
            </Card>
            <Card 
              onClick={() => { setTask('facts'); setFactIndex(Math.floor(Math.random() * facts.length)); }}
              className={cn("p-10 cursor-pointer text-center group transition-all h-[240px] flex flex-col items-center justify-center gap-4", sukoonMode ? "bg-slate-900 border-slate-800" : "hover:border-primary-soft/30 hover:shadow-2xl")}
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Zap />
              </div>
              <p className="font-serif font-bold text-lg">Curious Fact</p>
              <span className="text-xs text-gray-400">Gently shift your focus</span>
            </Card>
          </motion.div>
        ) : task === 'rhythm' ? (
          <motion.div key="rhythm" className="text-center space-y-12">
            <div className="space-y-4">
              <h3 className={cn("text-3xl font-serif font-bold tracking-tight", sukoonMode ? "text-white" : "text-gray-900")}>Focus on the rhythm</h3>
              <p className="text-gray-400">Tap the circle at a steady pace to fill the progress.</p>
            </div>
            <button 
              onClick={() => {
                if(count >= 9) setTask('none');
                else setCount(c => c + 1);
              }}
              className={cn(
                "w-48 h-48 rounded-full flex items-center justify-center text-4xl font-bold transition-all relative overflow-hidden",
                sukoonMode ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-primary-soft shadow-2xl border-2 border-primary-soft/10 active:scale-95"
              )}
            >
              <div className="absolute inset-x-0 bottom-0 bg-primary-soft/10 transition-all duration-300" style={{ height: `${(count/10)*100}%` }} />
              <span className="relative z-10">{10 - count}</span>
            </button>
            <Button variant="ghost" onClick={() => setTask('none')} className="uppercase tracking-widest opacity-50">Exit Task</Button>
          </motion.div>
        ) : (
          <motion.div key="facts" className="text-center space-y-12">
            <Card className={cn("p-12 max-w-sm mx-auto shadow-2xl transition-all", sukoonMode ? "bg-slate-900 border-slate-800" : "border-0")}>
              <p className={cn("text-2xl font-serif italic leading-relaxed", sukoonMode ? "text-slate-100" : "text-gray-800")}>"{facts[factIndex]}"</p>
            </Card>
            <div className="space-y-4">
              <Button onClick={() => setFactIndex(i => (i + 1) % facts.length)} className="rounded-full px-8">Read Another</Button>
              <br />
              <Button variant="ghost" onClick={() => setTask('none')} className="uppercase tracking-widest opacity-50">Back to Sanctuary</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CalmSanctuary = () => {
  const { lang, sukoonMode, setSukoonMode, wallMessages } = useAppStore();
  const [activeTab, setActiveTab] = useState<'sounds' | 'wall' | 'distract'>('wall');
  const [theme, setTheme] = useState<keyof typeof THEMES>('ocean');
  const t = translations[lang];

  const cycleTheme = () => {
    const keys = Object.keys(THEMES) as (keyof typeof THEMES)[];
    const currentIndex = keys.indexOf(theme);
    setTheme(keys[(currentIndex + 1) % keys.length]);
  };

  return (
    <div className={cn("relative z-10 space-y-12", sukoonMode && "dark")}>
      <EnhancedBackground sukoonMode={sukoonMode} theme={theme} />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-4 border-b border-gray-100/20">
        <div className="space-y-2 text-center md:text-left">
          <h2 className={cn("text-5xl font-serif font-bold tracking-tight drop-shadow-sm transition-colors duration-1000", sukoonMode ? "text-white" : "text-gray-900")}>
            {sukoonMode ? "Sukoon" : "Sanctuary"}
          </h2>
          <p className="text-gray-500 font-medium">
            {sukoonMode ? "Peace in minimal stimulation" : "A space to breathe and connect"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={cycleTheme} className="rounded-full px-6">
            <Sparkles className="w-4 h-4 mr-2" />
            {THEMES[theme].name}
          </Button>
          <Button 
            variant={sukoonMode ? 'primary' : 'outline'} 
            onClick={() => setSukoonMode(!sukoonMode)}
            className="rounded-full w-14 h-14 p-0"
          >
            {sukoonMode ? <CloudMoon className="w-6 h-6" /> : <Wind className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-2 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[32px] max-w-md mx-auto shadow-sm">
        {(['sounds', 'wall', 'distract'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === tab 
                ? "bg-white text-primary-soft shadow-md" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/30"
            )}
          >
            {tab === 'distract' ? "Reset" : t[tab] || tab}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="min-h-[500px]"
        >
          {activeTab === 'sounds' && <Soundscapes sukoonMode={sukoonMode} />}
          {activeTab === 'wall' && <WallOfHope messages={wallMessages} sukoonMode={sukoonMode} lang={lang} />}
          {activeTab === 'distract' && <DistractTasks sukoonMode={sukoonMode} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
