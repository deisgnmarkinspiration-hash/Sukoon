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
      "min-h-[100dvh] transition-colors duration-1000 overflow-x-hidden relative flex flex-col",
      sukoonMode ? "bg-slate-950 text-slate-100" : "bg-pastel-green text-gray-900"
    )}>
      {sukoonMode && <div className="fixed inset-0 z-0 atmosphere opacity-30 pointer-events-none" />}
      
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-2 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 transition-colors",
                sukoonMode ? "bg-primary-strong/30 border border-primary-strong/20" : "bg-primary-strong"
              )}>
                 <CloudRain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-serif font-bold tracking-tight">Sukoon</span>
           </div>
           
           <div className={cn(
              "flex items-center backdrop-blur-xl border p-1.5 rounded-2xl shadow-sm transition-all",
              sukoonMode ? "bg-slate-900/60 border-slate-800" : "bg-white/40 border-white/50"
           )}>
              <NavButton icon={<HomeIcon />} active={view === 'home'} onClick={() => setView('home')} sukoon={sukoonMode} />
              <NavButton icon={<BookOpen />} active={view === 'journal'} onClick={() => setView('journal')} sukoon={sukoonMode} />
              <NavButton icon={<MessageSquare />} active={view === 'chat'} onClick={() => setView('chat')} sukoon={sukoonMode} />
              <NavButton icon={<SettingsIcon />} active={view === 'settings'} onClick={() => setView('settings')} sukoon={sukoonMode} />
           </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto pt-20 sm:pt-28 px-4 sm:px-6 flex-1 relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {view === 'home' && <HomeTimeline onSOS={() => setView('calm')} setView={setView} />}
            {view === 'calm' && <CalmSanctuary />}
            {view === 'chat' && <GeminiChat />}
            {view === 'journal' && <JournalView />}
            {view === 'settings' && <SettingsView />}
            {view === 'futureMe' && <FutureMeView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Modals or FAB could go here */}
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
      <div className="grid grid-cols-1 gap-6">
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
    <div className="space-y-10 max-w-xl mx-auto">
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

const NavButton = ({ icon, active, onClick, sukoon }: { icon: any, active: boolean, onClick: () => void, sukoon?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
      active 
        ? (sukoon ? "bg-primary-strong/40 text-white shadow-lg border border-primary-strong/30" : "bg-primary-strong text-white shadow-lg") 
        : (sukoon ? "text-slate-500 hover:text-primary-soft" : "text-gray-400 hover:text-primary-soft")
    )}
  >
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" }) : icon}
  </button>
);

const BackgroundBlobs = () => (
  <div className="absolute inset-0 z-0 opacity-40">
    <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-20 -left-20 w-96 h-96 bg-primary-soft/30 rounded-full blur-[120px]" />
    <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-1/2 -right-20 w-[450px] h-[450px] bg-emerald-100 rounded-full blur-[140px]" />
  </div>
);
