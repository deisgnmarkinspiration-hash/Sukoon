import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  BookOpen, 
  CloudRain, 
  Anchor, 
  MessageSquare, 
  AlertCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';

import { format } from 'date-fns';
import { useAppStore } from './store/useAppStore';
import { useAppInitialization } from './hooks/useAppInitialization';
import { dbService } from './services/firebase';
import { translations } from './translations';
import { cn } from './lib/utils';

// UI Components
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

// Feature Components
import { HomeTimeline } from './features/home/HomeTimeline';
import { CalmSanctuary } from './features/calm/CalmSanctuary';
import { GeminiChat } from './features/chat/GeminiChat';

// --- Main App Component ---

export default function App() {
  useAppInitialization();
  const { user, profile, initializing, sukoonMode, lang } = useAppStore();
  const [view, setView] = useState<'home' | 'journal' | 'calm' | 'futureMe' | 'chat' | 'settings'>('home');
  const t = translations[lang];

  if (initializing) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-pastel-green">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-primary-strong mb-6"
        >
          <CloudRain className="w-16 h-16" />
        </motion.div>
        <p className="text-sm font-bold tracking-[0.3em] uppercase opacity-40">Breathe In... Breathe Out...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (profile && !profile.onboardingComplete) {
     return <OnboardingView onComplete={() => window.location.reload()} />;
  }

  return (
    <div className={cn(
      "h-[100dvh] w-screen transition-colors duration-1000 overflow-hidden relative flex flex-col",
      sukoonMode ? "bg-slate-950 text-slate-100" : "bg-pastel-green text-gray-900"
    )}>
      {sukoonMode && <div className="fixed inset-0 z-0 atmosphere opacity-30 pointer-events-none" />}
      
      {/* App Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between pointer-events-none">
         <div className="flex items-center gap-2 pointer-events-auto">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-md transform -rotate-12 transition-colors",
              sukoonMode ? "bg-primary-strong/30 border border-primary-strong/20" : "bg-primary-strong"
            )}>
               <CloudRain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight">Sukoon</span>
         </div>
         {/* Optional: Add a small user avatar or just keep it minimal */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-20 pb-28 px-4 sm:px-6 relative z-10 w-full scroll-smooth">
        <div className="max-w-4xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="min-h-full"
            >
              {view === 'home' && <HomeTimeline onSOS={() => setView('calm')} setView={setView} />}
              {view === 'calm' && <CalmSanctuary />}
              {view === 'chat' && <GeminiChat />}
              {view === 'journal' && <JournalView />}
              {view === 'settings' && <SettingsView />}
              {view === 'futureMe' && <FutureMeView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 pb-safe">
        <div className={cn(
          "max-w-md mx-auto flex items-center justify-between px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl border transition-all",
           sukoonMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-white"
        )}>
          <NavButton icon={<HomeIcon />} label="Home" active={view === 'home'} onClick={() => setView('home')} sukoon={sukoonMode} />
          <NavButton icon={<BookOpen />} label="Journal" active={view === 'journal'} onClick={() => setView('journal')} sukoon={sukoonMode} />
          <NavButton icon={<CloudRain />} label="Calm" active={view === 'calm'} onClick={() => setView('calm')} sukoon={sukoonMode} />
          <NavButton icon={<MessageSquare />} label="Chat" active={view === 'chat'} onClick={() => setView('chat')} sukoon={sukoonMode} />
          <NavButton icon={<SettingsIcon />} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} sukoon={sukoonMode} />
        </div>
      </nav>
    </div>
  );
}

// --- Sub-Views ---

const LoginView = () => {
  const [loggingIn, setLoggingIn] = useState(false);
  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-pastel-green p-6 overflow-hidden relative">
      <BackgroundBlobs />
      <Card className="w-full max-w-sm p-10 border-0 shadow-2xl relative z-10 text-center space-y-10">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary-strong rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-primary-soft/30 rotate-12">
            <CloudRain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight">Sukoon</h1>
          <p className="text-gray-400 font-medium">Your sanctuary for mental clarity and emotional peace.</p>
        </div>
        
        <Button 
          onClick={async () => {
            setLoggingIn(true);
            try { await dbService.auth.loginWithGoogle(); } catch(e) {}
            setLoggingIn(false);
          }}
          disabled={loggingIn}
          className="w-full h-14 rounded-2xl"
        >
          {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with Google"}
        </Button>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe • Anonymous • Healing</p>
      </Card>
    </div>
  );
};

const JournalView = () => {
  const { lang, journalEntries, sukoonMode } = useAppStore();
  const t = translations[lang];
  return (
    <div className="space-y-10">
      <header className="space-y-2 px-1">
        <h2 className={cn("text-4xl font-serif font-bold tracking-tight", sukoonMode ? "text-white" : "text-gray-900")}>{t.journal}</h2>
        <p className="text-gray-500">A timeline of your reflections and deep thoughts.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {journalEntries.map(entry => (
          <Card key={entry.id} className={cn("p-8 hover:shadow-xl transition-all border-0 shadow-sm", sukoonMode ? "bg-slate-900/50" : "bg-white")}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {format(entry.timestamp instanceof Date ? entry.timestamp : (entry.timestamp as any)?.toDate?.() || new Date(), 'PPP')}
              </span>
            </div>
            <p className={cn("text-xl font-serif leading-relaxed", sukoonMode ? "text-slate-200" : "text-gray-800")}>{entry.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const FutureMeView = () => {
  const { lang, futureMeMessages, sukoonMode } = useAppStore();
  const t = translations[lang];
  return (
    <div className="space-y-10">
       <header className="space-y-2 px-1">
        <h2 className={cn("text-4xl font-serif font-bold tracking-tight", sukoonMode ? "text-white" : "text-gray-900")}>Future Me</h2>
        <p className="text-gray-500 font-medium">Messages sent from your past self to ground you in the future.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {futureMeMessages.map(msg => (
          <Card key={msg.id} className={cn("p-8 border-0 shadow-lg relative overflow-hidden group transition-all", sukoonMode ? "bg-slate-900 text-slate-100" : "bg-primary-strong text-white")}>
            <Anchor className="absolute top-0 right-0 w-32 h-32 opacity-5 -rotate-12 group-hover:scale-110 transition-transform" />
            <p className="text-lg font-serif italic mb-6">"{msg.prompt || "A message for you..."}"</p>
            <div className="flex items-center justify-between relative z-10">
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Recorded {format(msg.createdAt instanceof Date ? msg.createdAt : (msg.createdAt as any)?.toDate?.() || new Date(), 'MMM d')}</span>
               <Button variant="secondary" className={cn("h-10 px-4 border-0", sukoonMode ? "bg-slate-800 text-slate-100" : "bg-white/20 text-white")}>Play Recording</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { lang, setLang, sukoonMode, setSukoonMode } = useAppStore();
  const t = translations[lang];
  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h2 className={cn("text-4xl font-serif font-bold tracking-tight", sukoonMode ? "text-white" : "text-gray-900")}>Settings</h2>
      <Card className={cn("divide-y border-0 shadow-sm transition-all", sukoonMode ? "bg-slate-900/50 divide-slate-800" : "bg-white divide-gray-50")}>
        <div className="p-8 flex items-center justify-between">
           <div className="space-y-1">
              <p className={cn("font-bold text-lg", sukoonMode ? "text-slate-100" : "text-gray-900")}>Language</p>
              <p className="text-xs text-gray-400">Select your primary communication language.</p>
           </div>
           <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as any)}
              className={cn("border-0 rounded-xl px-4 py-2 font-bold text-sm outline-none ring-1 transition-all", 
                sukoonMode ? "bg-slate-800 text-slate-100 ring-slate-700" : "bg-gray-50 ring-gray-100")}
           >
             <option value="en">English</option>
             <option value="hi">Hindi</option>
             <option value="ur">Urdu</option>
           </select>
        </div>
        <div className="p-8 flex items-center justify-between">
           <div className="space-y-1">
              <p className={cn("font-bold text-lg", sukoonMode ? "text-slate-100" : "text-gray-900")}>Sukoon Mode</p>
              <p className="text-xs text-gray-400">Low-stimulation interface for overwhelmed moments.</p>
           </div>
           <div 
             onClick={() => setSukoonMode(!sukoonMode)}
             className={cn(
                "w-12 h-6 rounded-full transition-all cursor-pointer relative",
                sukoonMode ? "bg-primary-strong" : "bg-gray-200"
             )}
           >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                sukoonMode ? "right-1" : "left-1"
              )} />
           </div>
        </div>
        <div className="p-8">
           <Button variant="danger" onClick={() => dbService.auth.logout()} className="w-full">
             <LogOut className="w-4 h-4 mr-2" /> {t.logout}
           </Button>
        </div>
      </Card>
    </div>
  );
};

const OnboardingView = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAppStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ displayName: '', preferredLanguage: 'en' as any });

  const steps = [
    { title: "Welcome to Sukoon", desc: "A sanctuary for your mind. Let's start by getting to know you." },
    { title: "What should we call you?", desc: "Your name will be kept private." },
    { title: "Select your language", desc: "Sukoon talks to you in your preferred language." }
  ];

  const handleFinish = async () => {
    if (!user) return;
    await dbService.auth.createUserProfile({
      uid: user.uid,
      email: user.email!,
      displayName: profile.displayName,
      preferredLanguage: profile.preferredLanguage,
      onboardingComplete: true,
      createdAt: new Date()
    });
    onComplete();
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-white p-6">
       <div className="max-w-sm w-full space-y-12 text-center">
          <div className="space-y-4">
             <h2 className="text-4xl font-serif font-bold tracking-tight">{steps[step].title}</h2>
             <p className="text-gray-400 font-medium">{steps[step].desc}</p>
          </div>

          <div className="min-h-[60px]">
             {step === 1 && (
               <input 
                 autoFocus
                 value={profile.displayName} 
                 onChange={e => setProfile({...profile, displayName: e.target.value})}
                 className="w-full border-b-2 border-gray-100 py-4 text-2xl font-serif outline-none focus:border-primary-soft transition-colors"
                 placeholder="Your name"
               />
             )}
             {step === 2 && (
               <div className="flex gap-2 justify-center">
                 {['en', 'hi', 'ur'].map(l => (
                   <button 
                     key={l} 
                     onClick={() => setProfile({...profile, preferredLanguage: l})}
                     className={cn(
                       "w-12 h-12 rounded-xl font-bold uppercase transition-all",
                       profile.preferredLanguage === l ? "bg-primary-strong text-white" : "bg-gray-100 text-gray-400"
                     )}
                   >
                     {l}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="flex gap-4">
             {step > 0 && <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>}
             <Button 
               onClick={() => step === 2 ? handleFinish() : setStep(s => s + 1)} 
               className="flex-1"
             >
               {step === 2 ? "Begin Journey" : "Next"}
             </Button>
          </div>
       </div>
    </div>
  );
}

// --- Helpers ---

const NavButton = ({ icon, label, active, onClick, sukoon }: { icon: any, label?: string, active: boolean, onClick: () => void, sukoon?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-2 rounded-xl transition-all relative overflow-hidden group w-14",
      active 
        ? (sukoon ? "text-primary-soft" : "text-primary-strong") 
        : (sukoon ? "text-slate-500 hover:text-slate-300" : "text-gray-400 hover:text-gray-700")
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
      active && (sukoon ? "bg-primary-strong/20" : "bg-primary-soft/10")
    )}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn("w-5 h-5", active && "scale-110 duration-300") }) : icon}
    </div>
    {label && (
      <span className={cn(
        "text-[9px] font-bold mt-1 transition-all",
        active ? "opacity-100 uppercase tracking-wide" : "opacity-0 h-0 w-0 group-hover:opacity-100 overflow-hidden"
      )}>
        {label}
      </span>
    )}
  </button>
);

const BackgroundBlobs = () => (
  <div className="absolute inset-0 z-0 opacity-40">
    <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-20 -left-20 w-96 h-96 bg-primary-soft/30 rounded-full blur-[120px]" />
    <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-1/2 -right-20 w-[450px] h-[450px] bg-emerald-100 rounded-full blur-[140px]" />
  </div>
);
