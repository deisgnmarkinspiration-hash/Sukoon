import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  MessageCircle, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Smile, 
  Frown, 
  Meh, 
  Wind, 
  ShieldAlert,
  Loader2,
  ChevronRight,
  Send,
  User as UserIcon,
  Mic,
  MicOff,
  Sun,
  Square,
  Zap,
  Brain,
  Scale,
  CloudMoon,
  TrendingUp,
  History,
  Timer,
  Video,
  VideoOff,
  Anchor,
  Archive,
  Play,
  Volume2,
  Trash2,
  X,
  AlertOctagon,
  Sparkles,
  Wind as CalmIcon,
  MessageSquare,
  Repeat,
  Globe,
  Bell,
  ShieldCheck,
  ChevronRight as ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, startOfDay, subDays, isSameDay } from "date-fns";
import type { User } from "firebase/auth";
import { 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc,
  Timestamp,
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";

import { auth, db, loginWithGoogle, logout, OperationType, handleFirestoreError } from "./lib/firebase";
import { GeminiQuotaExceededError } from "./services/gemini";
import { cn } from "./lib/utils";
import { translations, Language } from "./translations";
import { Mood, UserProfile, MoodEntry, JournalEntry, Goal, ChatMessage, MemoryEntry, DecisionSession, Intervention, FutureMeMessage, WallOfHopeMessage } from "./types";
import { chatWithSukoon, detectCrisis, transcribeAudio, detectPatterns, generateIntervention, structureDecision, generateWisdom } from "./services/gemini";

// --- Components ---

const CalmingBackground = ({ sukoonMode }: { sukoonMode?: boolean }) => (
  <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden select-none transition-colors duration-1000 bg-transparent")}>
    <motion.div 
      animate={{ 
        x: [0, 100, -50, 0], 
        y: [0, 50, 100, 0],
        scale: [1, 1.2, 0.9, 1],
        rotate: [0, 45, -45, 0]
      }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className={cn(
        "absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-1000",
        sukoonMode ? "bg-indigo-900/40" : "bg-primary-soft/10"
      )}
    />
    <motion.div 
      animate={{ 
        x: [0, -120, 60, 0], 
        y: [0, 80, -40, 0],
        scale: [1, 1.3, 1.1, 1],
        rotate: [0, -30, 30, 0]
      }}
      transition={{ duration: 50, repeat: Infinity, delay: 2, ease: "linear" }}
      className={cn(
        "absolute top-[30%] -right-[15%] w-[55%] h-[55%] rounded-full blur-[100px] transition-colors duration-1000",
        sukoonMode ? "bg-slate-800/60" : "bg-primary-soft/10"
      )}
    />
    <motion.div 
      animate={{ 
        x: [0, 80, -100, 0], 
        y: [0, -120, 50, 0],
        scale: [1, 1.1, 1.2, 1]
      }}
      transition={{ duration: 45, repeat: Infinity, delay: 5, ease: "linear" }}
      className={cn(
        "absolute -bottom-[15%] left-[15%] w-[45%] h-[45%] rounded-full blur-[80px] transition-colors duration-1000",
        sukoonMode ? "bg-blue-900/30" : "bg-primary-strong/5"
      )}
    />
  </div>
);

const Button = ({ 
  children, 
  className, 
  variant = 'primary', ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' }) => {
  const variants = {
    primary: "bg-primary-soft text-white hover:bg-primary-strong dark:bg-primary-strong dark:hover:bg-primary-soft",
    secondary: "bg-pastel-green text-primary-strong hover:bg-primary-soft/20 dark:bg-slate-800 dark:text-primary-soft",
    danger: "bg-primary-strong/20 text-primary-strong hover:bg-primary-strong/30 dark:bg-red-900/20 dark:text-red-400",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800",
    outline: "bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
  };
  return (
    <button className={cn("px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2", variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-primary-soft/5 dark:border-slate-800/50 backdrop-blur-sm", className)} {...props}>
    {children}
  </div>
);

const InterventionOverlay = ({ intervention, onComplete }: { intervention: Intervention, onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(intervention.steps[0].duration);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (step < intervention.steps.length - 1) {
      setStep(s => s + 1);
      setTimeLeft(intervention.steps[step + 1].duration);
    } else {
      setTimeout(onComplete, 1500);
    }
  }, [timeLeft, step]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[100] bg-emerald-950/95 dark:bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 text-center text-white"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary-soft font-bold">{intervention.type} • {intervention.tone} tone</span>
          <h2 className="text-3xl font-serif">{intervention.title}</h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="min-h-[120px] flex flex-col items-center justify-center"
          >
            <p className="text-xl leading-relaxed">{intervention.steps[step].text}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary-soft/30 flex items-center justify-center relative">
            <svg className="absolute inset-0 -rotate-90 w-12 h-12">
              <circle 
                cx="24" cy="24" r="22" 
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray="138"
                strokeDashoffset={138 - (138 * timeLeft / intervention.steps[step].duration)}
                className="text-primary-soft transition-all duration-1000"
              />
            </svg>
            <span className="font-mono text-sm">{timeLeft}s</span>
          </div>
          <button onClick={onComplete} className="text-primary-soft/50 text-xs hover:text-primary-soft">Skip exercise</button>
        </div>
      </div>
    </motion.div>
  );
};

const InsightsView = ({ memories }: { memories: MemoryEntry[] }) => (
  <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header className="space-y-1">
      <h2 className="text-3xl font-serif dark:text-slate-100">Emotional Patterns</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm italic italic-small">Reflections from your recent journey.</p>
    </header>

    <div className="grid gap-4">
      {memories.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center gap-4 border-dashed border-primary-soft/20">
          <Brain className="w-10 h-10 text-primary-soft/30" />
          <p className="text-gray-400 text-sm max-w-[200px]">We're still learning your rhythm. Continue journaling and checking in.</p>
        </Card>
      ) : (
        memories.map((m, i) => (
          <Card key={i} className="group hover:border-primary-soft/30 transition-colors">
            <div className="flex gap-4">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                m.type === 'trigger' ? "bg-primary-strong/10 text-primary-strong" : 
                m.type === 'strength' ? "bg-pastel-green text-primary-soft" : "bg-primary-soft/10 text-primary-soft"
              )}>
                {m.type === 'trigger' ? <Zap className="w-5 h-5" /> : 
                 m.type === 'strength' ? <TrendingUp className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold flex items-center gap-2">
                  {m.patternName}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{m.frequency}x</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{m.observation}</p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>

    <Card className="bg-primary-strong text-white border-0 overflow-hidden relative">
      <div className="relative z-10 space-y-4">
        <h3 className="font-serif text-xl">Stability vs pressure</h3>
        <p className="text-primary-soft/30 text-sm">Focus on consistent reflection, not just "streaks." You're doing the work.</p>
        <div className="flex gap-1 h-8 items-end">
          {[4, 7, 5, 8, 3, 6, 9, 7, 5, 8].map((v, i) => (
            <div key={i} className="flex-1 bg-white/10 rounded-t-sm relative group">
              <motion.div 
                initial={{ height: 0 }} animate={{ height: `${v * 10}%` }} 
                className="absolute bottom-0 inset-x-0 bg-primary-soft rounded-t-sm transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
        <TrendingUp className="w-32 h-32" />
      </div>
    </Card>
  </div>
);

const DecisionView = ({ decisions, onAnalyze }: { decisions: DecisionSession[], onAnalyze: (problem: string) => void }) => {
  const [problem, setProblem] = useState("");

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-1">
        <h2 className="text-3xl font-serif dark:text-slate-100">Decision Clarity</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm italic-small italic">STRUCTURE THINKING, DON'T OVERTHINK IT.</p>
      </header>

      <div className="space-y-4">
        <textarea 
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="What's weighing on your mind?"
          className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 text-sm border border-gray-100 dark:border-slate-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[120px] shadow-sm"
        />
        <Button onClick={() => onAnalyze(problem)} disabled={!problem.trim()} className="w-full bg-emerald-600 dark:bg-emerald-700 text-white h-14 rounded-3xl">
          Analyze Perspectives
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2">Past Sessions</h3>
        {decisions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8 dark:text-gray-500">No past sessions yet.</p>
        ) : (
          decisions.map((d, i) => (
            <Card key={i} className="group hover:border-emerald-200 dark:hover:border-slate-700 cursor-pointer">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="font-bold line-clamp-1 dark:text-slate-200">{d.problem}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">{format(d.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// --- Future Me Support ---

interface FutureMeViewProps {
  messages: FutureMeMessage[];
  onPlay: (msg: FutureMeMessage) => void;
  uid: string;
  lang: Language;
}

const FutureMeView = ({ messages, onPlay, uid, lang }: FutureMeViewProps) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [type, setType] = useState<'text' | 'audio' | 'video'>('text');
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const t = translations[lang];
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const prompts = [
    "How can you gently communicate your academic or career goals to your family when they seem to have a different vision?",
    "When the pressure to succeed (academic/career) feels overwhelming, what small act helps you ground yourself?",
    "Looking past familial and societal expectations, what is one thing *you* truly want for your future?",
    "When you feel defined by your marks or your job title, what anchors you in your own worth?",
    "What would you tell a younger version of yourself who feared 'log kya kahenge' (what people will say)?"
  ];
  const [activePrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  const tagOptions = ["Anxiety", "Anger", "Sadness", "Panic", "Hopelessness", "General"];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      setRecordingStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        const base64 = await blobToBase64(blob);
        setContent(base64);
        stream.getTracks().forEach(t => t.stop());
        setRecordingStream(null);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone/Camera access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const save = async () => {
    // Media content is base64 string, text content is also string. Validate it's not empty.
    if (!content || (type === 'text' && !content.trim()) || tags.length === 0) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "futureMeMessages"), {
        uid,
        type,
        content,
        tags,
        prompt: activePrompt,
        createdAt: serverTimestamp()
      });
      setMode('list');
      setContent("");
      setTags([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "futureMeMessages");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif dark:text-slate-100">{t.futureMe}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm italic-small italic">{t.messagesFromSelf}</p>
        </div>
        <Button onClick={() => setMode(mode === 'list' ? 'create' : 'list')} variant="secondary">
          {mode === 'list' ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {mode === 'list' ? t.recordNew : t.cancel}
        </Button>
      </header>

      {mode === 'create' ? (
        <Card className="space-y-6 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-primary-soft/5 dark:bg-emerald-900/10 p-4 rounded-2xl border border-primary-soft/10 dark:border-emerald-900/30">
            <p className="text-sm font-serif italic text-primary-strong dark:text-emerald-400">"{activePrompt}"</p>
          </div>

          <div className="flex gap-2">
            {(['text', 'audio', 'video'] as const).map(t => (
              <button 
                key={t}
                onClick={() => { setType(t); setContent(""); }}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-medium transition-all capitalize",
                  type === t ? "bg-primary-soft border-primary-soft text-white" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {type === 'text' && (
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your heart out..."
              className="w-full min-h-[150px] p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-soft/20 outline-none text-sm dark:text-gray-200"
            />
          )}

          {(type === 'audio' || type === 'video') && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                {type === 'video' && (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={cn("w-full h-full object-cover", !recordingStream && "hidden")} 
                  />
                )}
                {!recordingStream && !content && (
                  <div className="text-center text-gray-500 space-y-2">
                    {type === 'video' ? <Video className="w-10 h-10 mx-auto opacity-20" /> : <Mic className="w-10 h-10 mx-auto opacity-20" />}
                    <p className="text-xs">Ready to record</p>
                  </div>
                )}
                {content && !recordingStream && (
                  <div className="text-center text-primary-soft space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest">Message Captured</p>
                    <Button onClick={() => setContent("")} variant="ghost" className="text-white/50 hover:text-white">Redo</Button>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary-soft/20 px-3 py-1 rounded-full backdrop-blur-sm border border-primary-soft/50">
                    <div className="w-2 h-2 rounded-full bg-primary-soft animate-pulse" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">Live</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!content && !isRecording}
                  className={cn(
                    "w-16 h-16 rounded-full shadow-lg shadow-primary-soft/20",
                    isRecording ? "bg-primary-strong animate-pulse" : "bg-primary-soft hover:bg-primary-strong"
                  )}
                >
                  {isRecording ? <Square className="w-6 h-6 fill-current" /> : (type === 'video' ? <Video className="w-6 h-6" /> : <Mic className="w-6 h-6" />)}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tag this message for distress:</p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map(tag => (
                <button 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-medium transition-all",
                    tags.includes(tag) ? "bg-primary-soft/10 text-primary-strong border-primary-soft/20" : "bg-gray-50 text-gray-500 border-transparent"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving || !content || tags.length === 0} className="w-full bg-primary-soft text-white h-14 rounded-2xl shadow-lg shadow-primary-soft/20">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Store for Future Me"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="bg-primary-strong rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-serif">Quick Distant Access</h3>
              <p className="text-white/60 text-sm">Facing something right now? Tap the anchor that matches your feeling.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tagOptions.map(tag => {
                  const relevant = messages.find(m => m.tags.includes(tag));
                  return (
                    <button 
                      key={tag}
                      onClick={() => relevant && onPlay(relevant)}
                      disabled={!relevant}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                        relevant ? "bg-white/10 border-white/20 hover:bg-white/20" : "opacity-30 cursor-not-allowed border-white/5"
                      )}
                    >
                      <Anchor className="w-4 h-4 text-primary-soft/50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Anchor className="absolute top-0 right-0 w-48 h-48 text-white/5 -rotate-12 translate-x-12 -translate-y-12" />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Your Archive</h3>
            {messages.length === 0 ? (
              <Card className="text-center py-12 text-gray-400 space-y-4 dark:text-gray-500">
                <Archive className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-sm">No messages stored yet. Create one while you feel stable.</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {messages.map(m => (
                  <Card key={m.id} className="p-4 hover:border-primary-soft/20 dark:hover:border-slate-700 cursor-pointer group flex items-center justify-between" onClick={() => onPlay(m)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft/10 text-primary-soft dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center">
                        {m.type === 'video' ? <Video className="w-5 h-5" /> : (m.type === 'audio' ? <Volume2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex gap-1 flex-wrap">
                          {m.tags.map(t => <span key={t} className="text-[8px] font-bold bg-primary-soft/10 text-primary-strong dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-full uppercase">{t}</span>)}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest">{format(m.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-soft dark:group-hover:text-slate-400 transition-colors" />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlaybackOverlay = ({ message, onClose }: { message: FutureMeMessage, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 atmosphere opacity-30 select-none pointer-events-none" />
      
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white z-10">
        <X className="w-8 h-8" />
      </button>

      <div className="max-w-2xl w-full space-y-12 text-center relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Anchor className="w-12 h-12 text-emerald-400 mx-auto opacity-50 mb-4" />
          <p className="text-emerald-400/50 text-[10px] uppercase tracking-[0.3em] font-bold">Message from your past self</p>
          <div className="flex gap-2 justify-center">
            {message.tags.map(t => <span key={t} className="text-[10px] text-white/30 border border-white/20 px-3 py-1 rounded-full uppercase tracking-widest">{t}</span>)}
          </div>
        </motion.div>

        <div className="min-h-[300px] flex items-center justify-center">
          {message.type === 'text' && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
              className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed max-w-lg mx-auto"
            >
              {message.content}
            </motion.p>
          )}

          {message.type === 'video' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}
              className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5"
            >
              <video 
                src={message.content} 
                controls 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
            </motion.div>
          )}

          {message.type === 'audio' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="space-y-8"
            >
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
                <Volume2 className="w-12 h-12 text-emerald-400" />
              </div>
              <audio src={message.content} controls autoPlay className="mx-auto" />
            </motion.div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
          className="pt-8"
        >
          <p className="text-white/20 text-xs italic">"Breathe. You have been here before, and you returned to peace."</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- Unified Components ---

const HomeTimeline = ({ 
  profile, 
  moods, 
  journalEntries, 
  onMoodClick,
  onJournalClick,
  onPlayFutureMe,
  onSOS,
  lang,
  futureMeMessages
}: {
  profile: UserProfile;
  moods: MoodEntry[];
  journalEntries: JournalEntry[];
  onMoodClick: () => void;
  onJournalClick: () => void;
  onPlayFutureMe: (msg: FutureMeMessage) => void;
  onSOS: () => void;
  lang: Language;
  futureMeMessages: FutureMeMessage[];
}) => {
  const t = translations[lang];
  
  const timeline = [
    ...moods.map(m => ({ ...m, type: 'mood' as const })),
    ...journalEntries.map(j => ({ ...j, type: 'journal' as const }))
  ].sort((a, b) => {
    const tA = (a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.()) || new Date(0);
    const tB = (b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.()) || new Date(0);
    return tB.getTime() - tA.getTime();
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-gray-900 leading-tight">
            {profile?.displayName?.split(' ')[0]},
          </h1>
          <p className="text-gray-500 font-medium">{t.howFeeling}</p>
        </div>
      </header>

      {/* SOS Lifeline */}
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onSOS}
        className="w-full bg-primary-strong text-white p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-primary-soft/10 group"
      >
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 text-white/80">{t.sos}</span>
          <h2 className="text-2xl font-serif font-bold">{t.overwhelmed}</h2>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
          <AlertOctagon className="w-8 h-8" />
        </div>
      </motion.button>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-4">
          <Card onClick={onMoodClick} className="bg-pastel-green dark:bg-emerald-900/20 border-0 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
             <div className="w-12 h-12 bg-white dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-primary-soft dark:text-emerald-400 shadow-sm">
                <Smile className="w-6 h-6" />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-primary-strong dark:text-emerald-300">{t.home} & {t.saveMood}</span>
          </Card>
          <Card onClick={onJournalClick} className="bg-primary-soft/5 dark:bg-slate-800/50 border-0 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary-soft/10 dark:hover:bg-slate-800 transition-colors">
             <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-primary-soft dark:text-slate-300 shadow-sm">
                <BookOpen className="w-6 h-6" />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-primary-soft dark:text-slate-400">{t.journal}</span>
          </Card>
      </div>

      {/* Future Me Prompt Integrated */}
      {futureMeMessages.length > 0 && (
        <Card className="bg-primary-strong p-6 text-white border-0 overflow-hidden relative group">
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-primary-soft" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary-soft/80">{t.futureMe}</span>
             </div>
             <p className="text-sm font-serif italic text-white/90">"{futureMeMessages[0].prompt || t.hearVoice}"</p>
             <Button 
               onClick={() => onPlayFutureMe(futureMeMessages[Math.floor(Math.random() * futureMeMessages.length)])}
               className="bg-primary-soft text-white border-0 w-full h-12 rounded-xl"
             >
                <Play className="w-4 h-4 fill-current" /> {t.playLifeline}
             </Button>
          </div>
          <Anchor className="absolute top-0 right-0 w-32 h-32 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-1">{t.appPreferences} • {t.home}</h3>
        {timeline.length === 0 ? (
          <Card className="text-center py-20 bg-white/50 dark:bg-slate-900/50 border-dashed border-gray-100 dark:border-slate-800">
             <Calendar className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-600 mb-4" />
             <p className="text-gray-400 dark:text-gray-500 text-sm max-w-[200px] mx-auto">Your timeline of healing starts today. Record your first mood or thought.</p>
          </Card>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-primary-soft/10 dark:before:bg-primary-strong/20">
            {timeline.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="relative pl-10"
              >
                <div className={cn(
                  "absolute left-0 top-1 w-[24px] h-[24px] rounded-full flex items-center justify-center z-10 shadow-sm",
                  item.type === 'mood' ? "bg-pastel-green dark:bg-emerald-900/40 text-primary-soft dark:text-emerald-400" : "bg-primary-soft dark:bg-slate-700 text-white dark:text-slate-300"
                )}>
                   {item.type === 'mood' ? <MoodIcon mood={(item as MoodEntry).mood} className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                </div>
                
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-2">
                     {format(item.timestamp instanceof Date ? item.timestamp : (item.timestamp as any)?.toDate() || new Date(), 'HH:mm • MMM d')}
                   </p>
                   {item.type === 'mood' ? (
                     <Card className={cn(
                       "p-4 border-0 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]",
                       (item as MoodEntry).mood === 'sad' || (item as MoodEntry).mood === 'anxious' ? "bg-primary-soft/5 dark:bg-slate-800/80" : "bg-white dark:bg-slate-800"
                     )}>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 dark:text-slate-200 capitalize leading-none tracking-tight">{(item as MoodEntry).mood}</p>
                          {(item as MoodEntry).note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic leading-relaxed">"{(item as MoodEntry).note}"</p>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-primary-soft dark:text-slate-300">
                          {(item as MoodEntry).intensity}
                        </div>
                     </Card>
                   ) : (
                     <Card className="p-5 border-0 shadow-sm bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{(item as JournalEntry).content}</p>
                     </Card>
                   )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Soundscapes = ({ lang, sukoonMode }: { lang: Language, sukoonMode?: boolean }) => {
  const t = translations[lang];

  const tracks = [
    { id: 'white', title: "White Noise", yt: "nMfPqeZjc2c" },
    { id: 'birds', title: "Morning Birds", yt: "eKFTSSKCzWA" },
    { id: 'rain', title: "Heavy Rain", yt: "mPZkdNFkNps" },
    { id: 'ocean', title: "Ocean Waves", yt: "f77SKdyn-1Y" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tracks.map(track => (
        <Card 
          key={track.id} 
          className={cn("p-4 overflow-hidden border", sukoonMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100")}
        >
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative mb-4">
            <iframe 
               width="100%" 
               height="100%" 
               src={`https://www.youtube.com/embed/${track.yt}?controls=0&showinfo=0&rel=0&autoplay=0&loop=1&playlist=${track.yt}`}
               title={track.title} 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               className="opacity-70 pointer-events-auto"
            />
          </div>
          <h3 className={cn("font-bold px-2", sukoonMode ? "text-slate-200 font-mono" : "text-gray-900")}>{track.title}</h3>
        </Card>
      ))}
    </div>
  );
};

const WallOfHope = ({ lang, uid, sukoonMode }: { lang: Language, uid: string, sukoonMode?: boolean }) => {
  const [messages, setMessages] = useState<WallOfHopeMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const q = query(collection(db, "wallOfHope"), limit(50));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as WallOfHopeMessage);
      setMessages(msgs.sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)));
    });
  }, []);

  const post = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "wallOfHope"), {
        text: input,
        authorLang: lang,
        likes: 0,
        createdAt: serverTimestamp()
      });
      setInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const like = async (msg: WallOfHopeMessage) => {
    try {
      await setDoc(doc(db, "wallOfHope", msg.id!), { likes: (msg.likes || 0) + 1 }, { merge: true });
    } catch (e) {}
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
       <div className={cn("p-6 rounded-[32px] space-y-4", sukoonMode ? "bg-slate-900 border border-slate-800" : "bg-pastel-green")}>
          <p className={cn("text-xs font-bold uppercase tracking-widest", sukoonMode ? "text-slate-500" : "text-primary-strong/60")}>{t.wallOfHope}</p>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.whatsOnMind}
            className={cn("w-full rounded-2xl p-4 text-sm border-none focus:ring-2 outline-none min-h-[100px]", 
              sukoonMode ? "bg-slate-800 text-slate-200 focus:ring-slate-700 placeholder:text-slate-500" : "bg-white/50 focus:ring-primary-soft/20 text-gray-900"
            )}
          />
          <Button 
            onClick={post} 
            disabled={sending || !input.trim()} 
            className={cn("w-full h-12 rounded-xl border-0", sukoonMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "")}
          >
             {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Anonymously"}
          </Button>
       </div>

       <div className="flex flex-col space-y-6">
          {messages.map(m => (
            <div key={m.id} className={cn("rounded-3xl p-6 border shadow-sm transition-all", sukoonMode ? "bg-slate-900 border-slate-800" : "bg-white border-primary-soft/10")}>
               <div className="flex items-center gap-3 mb-4">
                 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", sukoonMode ? "bg-slate-800" : "bg-gradient-to-tr from-primary-soft/50 to-primary-soft/20")}>
                   <UserIcon className={cn("w-5 h-5", sukoonMode ? "text-slate-500" : "text-white")} />
                 </div>
                 <div>
                   <p className={cn("text-sm font-bold", sukoonMode ? "text-slate-300 font-mono" : "text-gray-900")}>Anonymous</p>
                   <p className={cn("text-xs uppercase tracking-widest", sukoonMode ? "text-slate-500 font-mono" : "text-gray-400 font-bold")}>{m.authorLang}</p>
                 </div>
               </div>
               
               <p className={cn("text-base leading-relaxed mb-6 pl-2", sukoonMode ? "text-slate-200" : "text-gray-700 italic")}>"{m.text}"</p>
               
               <div className={cn("flex items-center gap-4 pt-4 border-t", sukoonMode ? "border-slate-800" : "border-gray-50")}>
                 <button onClick={() => like(m)} className={cn("flex items-center gap-1.5 text-sm transition-colors font-bold", 
                    sukoonMode 
                      ? (m.likes > 0 ? "text-red-400" : "text-slate-500 hover:text-slate-400") 
                      : (m.likes > 0 ? "text-red-500" : "text-primary-soft/40 hover:text-primary-soft")
                 )}>
                    <Heart className={cn("w-4 h-4", m.likes > 0 && "fill-current")} />
                    {m.likes || 0}
                 </button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const CalmSanctuary = ({ lang, uid, sukoonMode, setSukoonMode }: { lang: Language, uid: string, sukoonMode: boolean, setSukoonMode: (b: boolean) => void }) => {
  const [activeTab, setActiveTab] = useState<'sounds' | 'wall' | 'distract'>('wall');                
  const t = translations[lang];

  // Sukoon task states
  const [sukoonTask, setSukoonTask] = useState<'rhythm' | 'facts' | 'none'>('none');
  const [clickCount, setClickCount] = useState(0);
  const facts = [
    "A day on Venus is longer than a year on Venus.",
    "Wombat poop is cube-shaped so it doesn't roll away.",
    "Bananas glow blue under black lights.",
    "Octopuses have three hearts.",
    "A cloud can weigh more than a million pounds.",
    "Honey never spoils. You can eat 3000-year-old honey."
  ];
  const [factIndex, setFactIndex] = useState(0);
  
  return (
    <div className={cn("space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700", sukoonMode ? "dark" : "")}>
       <div className="dark:bg-slate-950 dark:text-slate-200 transition-colors duration-700 p-6 rounded-3xl">
         <header className="flex justify-between items-start mb-10">
           <div className="space-y-2">
             <h2 className={cn("text-4xl font-serif font-bold tracking-tight", sukoonMode ? "font-mono" : "")}>{sukoonMode ? "Sukoon Mode" : "Sanctuary"}</h2>
             <p className="text-gray-500 font-medium">{sukoonMode ? "Low-stimulation micro-tasks" : "Connect and find peace"}</p>
           </div>
           <button 
              onClick={() => setSukoonMode(!sukoonMode)}
              className={cn(
                  "p-3 rounded-full transition-all",
                  sukoonMode ? "bg-slate-800 text-yellow-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              title={sukoonMode ? "Exit Sukoon Mode" : "Enter Sukoon Mode"}
           >
              {sukoonMode ? <CloudMoon className="w-6 h-6" /> : <Wind className="w-6 h-6" />}
           </button>
         </header>
       
       <div className={cn("flex gap-2 p-1.5 rounded-3xl sticky top-0 z-20 overflow-x-auto", sukoonMode ? "bg-slate-900 border border-slate-800" : "bg-gray-100 backdrop-blur-sm bg-gray-100/80")}>
          {(['distract', 'sounds', 'wall'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? (sukoonMode ? "bg-slate-800 text-slate-200 shadow-sm" : "bg-white text-primary-soft shadow-sm") 
                  : (sukoonMode ? "text-slate-600 hover:text-slate-400" : "text-gray-400 hover:text-gray-600")
              )}
            >
              {tab === 'distract' ? "Reset" : (t[tab as keyof typeof t] || tab)}
            </button>
          ))}
       </div>

       <motion.div 
         key={activeTab}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="min-h-[400px]"
       >
          {activeTab === 'distract' && (
             <div className="animate-in fade-in">
               {sukoonTask === 'none' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <Card 
                      onClick={() => { setClickCount(0); setSukoonTask('rhythm'); }}
                      className={cn("p-8 cursor-pointer flex flex-col justify-between min-h-[160px] group transition-all", sukoonMode ? "bg-slate-900 border-slate-800 hover:border-slate-600" : "hover:border-primary-soft/30")}
                    >
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors", sukoonMode ? "bg-slate-800 text-slate-400 group-hover:text-slate-200" : "bg-primary-soft/10 text-primary-soft")}>
                         <div className="w-4 h-4 rounded-full bg-current animate-pulse" />
                      </div>
                      <h3 className={cn("font-bold tracking-tight", sukoonMode ? "font-mono" : "")}>Tap Rhythm</h3>
                      <p className="text-xs text-gray-500 mt-2">A physical grounding task.</p>
                    </Card>

                    <Card 
                      onClick={() => { setFactIndex(Math.floor(Math.random() * facts.length)); setSukoonTask('facts'); }}
                      className={cn("p-8 cursor-pointer flex flex-col justify-between min-h-[160px] group transition-all", sukoonMode ? "bg-slate-900 border-slate-800 hover:border-slate-600" : "hover:border-primary-soft/30")}
                    >
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors", sukoonMode ? "bg-slate-800 text-slate-400 group-hover:text-slate-200" : "bg-primary-soft/10 text-primary-soft")}>
                         <Zap className="w-5 h-5" />
                      </div>
                      <h3 className={cn("font-bold tracking-tight", sukoonMode ? "font-mono" : "")}>Random Fact</h3>
                      <p className="text-xs text-gray-500 mt-2">Change the subject.</p>
                    </Card>
                 </div>
               ) : sukoonTask === 'rhythm' ? (
                 <div className="space-y-12 flex flex-col items-center justify-center min-h-[50vh] py-12 animate-in fade-in">
                    <div className="text-center space-y-4">
                      <h2 className={cn("text-2xl", sukoonMode ? "font-mono" : "font-serif")}>Tap Rhythm</h2>
                      <p className="text-gray-500 text-sm">Tap the circle 10 times at a clear, steady pace.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (clickCount >= 9) {
                          setClickCount(0);
                          setSukoonTask('none');
                        } else {
                          setClickCount(c => c + 1);
                        }
                      }}
                      className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl overflow-hidden relative",
                        sukoonMode ? "border border-slate-700 bg-slate-800 active:bg-slate-700 shadow-black/50" : "border-2 border-primary-soft/20 bg-white active:bg-primary-soft/5 shadow-primary-soft/10"
                      )}
                    >
                      <div className={cn("absolute inset-0", sukoonMode ? "bg-slate-600/30" : "bg-primary-soft/10")} style={{ height: `${(clickCount / 10) * 100}%`, bottom: 0, top: 'auto', transition: 'height 0.2s' }} />
                      <span className={cn("text-3xl relative z-10", sukoonMode ? "font-mono text-slate-400" : "font-bold text-primary-soft")}>{10 - clickCount}</span>
                    </button>
                    <button onClick={() => setSukoonTask('none')} className="text-gray-400 hover:text-gray-600 text-xs uppercase tracking-widest">Quit</button>
                 </div>
               ) : (
                 <div className="space-y-12 flex flex-col items-center justify-center min-h-[50vh] py-12 animate-in fade-in">
                    <div className="text-center space-y-4">
                     <h2 className={cn("text-2xl", sukoonMode ? "font-mono" : "font-serif")}>Random Fact</h2>
                   </div>
                   <div className={cn("max-w-xs text-center p-8 rounded-3xl min-h-[200px] flex items-center justify-center", sukoonMode ? "border border-slate-800 bg-slate-900/50" : "border border-primary-soft/10 bg-white")}>
                     <p className={cn("text-lg leading-relaxed", sukoonMode ? "text-slate-300 font-serif" : "text-gray-700")}>{facts[factIndex]}</p>
                   </div>
                   <div className="flex flex-col items-center gap-4">
                     <button 
                       onClick={() => setFactIndex((i) => (i + 1) % facts.length)}
                       className={cn("px-6 py-3 rounded-2xl transition-colors font-medium shadow-sm", sukoonMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" : "bg-primary-soft text-white hover:bg-primary-strong")}
                     >
                       Next Fact
                     </button>
                     <button onClick={() => setSukoonTask('none')} className="text-gray-400 hover:text-gray-600 text-xs uppercase tracking-widest mt-4">Quit</button>
                   </div>
                 </div>
               )}
             </div>
          )}
          {activeTab === 'sounds' && <Soundscapes lang={lang} sukoonMode={sukoonMode} />}
          {activeTab === 'wall' && <WallOfHope lang={lang} uid={uid} sukoonMode={sukoonMode} />}
       </motion.div>
       </div>
     </div>
  )
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {}

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-pastel-green text-center">
          <ShieldAlert className="w-12 h-12 text-primary-strong mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Error</h2>
          <p className="text-gray-600 max-w-md mb-6">{errorMessage}</p>
          <Button onClick={() => window.location.reload()} variant="primary">Reload App</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <SukoonApp />
    </ErrorBoundary>
  );
}

function SukoonApp() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sukoonMode, setSukoonMode] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'talk' | 'calm' | 'settings' | 'mood' | 'journal'>('home');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);

  // Data
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [decisions, setDecisions] = useState<DecisionSession[]>([]);
  const [futureMeMessages, setFutureMeMessages] = useState<FutureMeMessage[]>([]);
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);
  const [activePlaybackMessage, setActivePlaybackMessage] = useState<FutureMeMessage | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);

  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('invalid-argument'))) {
          console.error("Please check your Firebase configuration.");
          setShowConfigError(true);
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const path = `users/${u.uid}`;
        try {
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const p = docSnap.data() as UserProfile;
            setProfile(p);
            if (p.preferredLanguage) setLang(p.preferredLanguage as Language);
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || "",
              displayName: u.displayName || "User",
              preferredLanguage: "en",
              onboardingComplete: false,
              createdAt: new Date(),
            };
            await setDoc(docRef, { ...newProfile, createdAt: serverTimestamp() });
            setProfile(newProfile);
            setLang("en");
          }
        } catch (err) {
          console.error("Profile Fetch Error:", err);
          handleFirestoreError(err, OperationType.GET, path);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Listeners
  useEffect(() => {
    if (!user) return;

    const moodsQ = query(
      collection(db, "moods"), 
      where("uid", "==", user.uid), 
      limit(20)
    );
    const moodUnsub = onSnapshot(moodsQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as MoodEntry)
        .sort((a, b) => {
          const tA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date(0);
          const tB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setMoods(sorted.slice(0, 10));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "moods"));

    const journalQ = query(
      collection(db, "journal"),
      where("uid", "==", user.uid),
      limit(10)
    );
    const journalUnsub = onSnapshot(journalQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as JournalEntry)
        .sort((a, b) => {
          const tA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date(0);
          const tB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setJournalEntries(sorted.slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "journal"));

    const goalsQ = query(collection(db, "goals"), where("uid", "==", user.uid));
    const goalsUnsub = onSnapshot(goalsQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as Goal)
        .sort((a, b) => {
          const tA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
          const tB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setGoals(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "goals"));

    const memoriesQ = query(collection(db, "memories"), where("uid", "==", user.uid), limit(20));
    const memoriesUnsub = onSnapshot(memoriesQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as MemoryEntry)
        .sort((a, b) => {
          const tA = a.lastTriggered instanceof Date ? a.lastTriggered : (a.lastTriggered as any)?.toDate?.() || new Date(0);
          const tB = b.lastTriggered instanceof Date ? b.lastTriggered : (b.lastTriggered as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setMemories(sorted.slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "memories"));

    const decisionsQ = query(collection(db, "decisions"), where("uid", "==", user.uid), limit(20));
    const decisionsUnsub = onSnapshot(decisionsQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as DecisionSession)
        .sort((a, b) => {
          const tA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
          const tB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setDecisions(sorted.slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "decisions"));

    const futureMeQ = query(collection(db, "futureMeMessages"), where("uid", "==", user.uid));
    const futureMeUnsub = onSnapshot(futureMeQ, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as FutureMeMessage)
        .sort((a, b) => {
          const tA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
          const tB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setFutureMeMessages(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "futureMeMessages"));

    return () => {
      moodUnsub();
      journalUnsub();
      goalsUnsub();
      memoriesUnsub();
      decisionsUnsub();
      futureMeUnsub();
    };
  }, [user]);

  const toggleSilentMode = async () => {
    if (!profile) return;
    const newMode = !profile.silentMode;
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, "users", profile.uid), { silentMode: newMode }, { merge: true });
      setProfile(p => p ? { ...p, silentMode: newMode } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const onAnalyzeDecision = async (problem: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const analysis = await structureDecision(problem);
      if (analysis) {
        await addDoc(collection(db, "decisions"), {
          uid: user.uid,
          problem,
          analysis: analysis.analysis,
          createdAt: serverTimestamp()
        });
        setView('home');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startPanicMode = async () => {
    setIsSOSActive(true);
    // Instant help sequence: Grounding then Future Me
    const intervention = await generateIntervention("panic", "Immediate crisis button pressed");
    if (intervention) {
      setActiveIntervention(intervention);
    } else {
      // Fallback to random Future Me if no AI intervention
      const randomMsg = futureMeMessages[Math.floor(Math.random() * futureMeMessages.length)];
      if (randomMsg) setActivePlaybackMessage(randomMsg);
      else setView('talk');
    }
  };

  useEffect(() => {
    if (!user || moods.length < 3) return;
    
    const runPatternDetection = async () => {
      try {
        const patterns = await detectPatterns([], moods, journalEntries);
        for (const p of patterns) {
          const existing = memories.find(m => m.patternName === p.patternName);
          if (existing) {
            await setDoc(doc(db, "memories", existing.id!), {
              frequency: existing.frequency + 1,
              lastTriggered: serverTimestamp(),
              observation: p.observation
            }, { merge: true });
          } else {
            await addDoc(collection(db, "memories"), {
              uid: user.uid,
              ...p,
              frequency: 1,
              lastTriggered: serverTimestamp()
            });
          }
        }
      } catch (e) {
        console.error("Pattern detection failed", e);
      }
    };

    // Run once every 5 checks or something similar to avoid too many calls
    const lastRun = localStorage.getItem(`lastPatternRun_${user.uid}`);
    const now = Date.now();
    if (!lastRun || now - parseInt(lastRun) > 1000 * 60 * 60 * 24) { // Once a day
      runPatternDetection();
      localStorage.setItem(`lastPatternRun_${user.uid}`, now.toString());
    }
  }, [user, moods.length]);

  const tr = translations[lang];

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 relative overflow-hidden transition-colors">
        <CalmingBackground />
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-soft dark:text-emerald-500" />
          <div className="absolute inset-0 blur-xl bg-primary-soft/20 dark:bg-emerald-500/20 animate-pulse" />
        </div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 animate-pulse relative z-10">{tr.findingPeace}</p>
      </div>
    );
  }

  if (!user) return <div className="min-h-screen relative overflow-hidden transition-colors"><CalmingBackground /><LoginView /></div>;

  if (!profile && !showConfigError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 relative overflow-hidden transition-colors">
        <CalmingBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-soft dark:text-emerald-500" />
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 animate-pulse">Synchronizing Profile...</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.onboardingComplete) {
    return (
      <div className="min-h-screen relative overflow-hidden transition-colors">
        <CalmingBackground />
        <OnboardingView 
          profile={profile} 
          lang={lang}
          setLang={setLang}
          onComplete={() => setProfile(p => p ? ({ ...p, onboardingComplete: true }) : null)} 
        />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-24 md:pb-0 md:pl-20 relative overflow-hidden transition-colors duration-700")}>
      <CalmingBackground sukoonMode={sukoonMode} />
      {/* Sidebar / Bottom Nav */}
      <Navigation view={view} setView={setView} lang={lang} sukoonMode={sukoonMode} />

      {showConfigError && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-50 border-b border-orange-100 p-3 flex items-center justify-center gap-4 animate-in slide-in-from-top duration-500">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <p className="text-xs text-orange-700 font-medium">
            Firebase Connection Issue: Please ensure you've clicked <span className="font-bold">"Create Database"</span> in your Firebase Console and enabled <span className="font-bold">Google Auth</span>.
          </p>
          <button onClick={() => setShowConfigError(false)} className="text-orange-900/40 hover:text-orange-900 transition-colors">
            <Plus className="w-4 h-4 rotate-45" />
          </button>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6 md:p-12 relative z-10">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <HomeTimeline 
              profile={profile!}
              moods={moods}
              journalEntries={journalEntries}
              futureMeMessages={futureMeMessages}
              onMoodClick={() => setView('mood')}
              onJournalClick={() => setView('journal')}
              onPlayFutureMe={(msg) => setActivePlaybackMessage(msg)}
              onSOS={startPanicMode}
              lang={lang}
            />
          )}

          {view === 'talk' && <ChatView profile={profile!} onNewIntervention={(i) => setActiveIntervention(i)} lang={lang} />}
          
          {view === 'calm' && (
             <CalmSanctuary 
               lang={lang} 
               uid={user.uid} 
               sukoonMode={sukoonMode}
               setSukoonMode={setSukoonMode}
             />
          )}

          {view === 'mood' && <MoodView onComplete={() => setView('home')} uid={user.uid} lang={lang} />}
          
          {view === 'journal' && <JournalView uid={user.uid} lang={lang} title="Express Yourself" onSave={() => setView('home')} />}
          
          {view === 'settings' && <SettingsView profile={profile!} onLogout={() => logout()} lang={lang} setLang={setLang} />}
        </AnimatePresence>
      </main>

      {/* Global Overlays */}
      <AnimatePresence>
        {activeIntervention && (
          <InterventionOverlay 
            intervention={activeIntervention} 
            onComplete={() => setActiveIntervention(null)} 
          />
        )}
        {activePlaybackMessage && (
          <PlaybackOverlay 
            message={activePlaybackMessage} 
            onClose={() => setActivePlaybackMessage(null)} 
          />
        )}
      </AnimatePresence>

      {/* Crisis Modal */}
      <CrisisModal isOpen={isCrisisModalOpen} onClose={() => setIsCrisisModalOpen(false)} lang={lang} />
    </div>
  );
}

// --- Views ---

function LoginView() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/cancelled-popup-request') {
        setError("Login popup was closed. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-transparent relative z-10">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-2">
          <div className="bg-primary-soft dark:bg-emerald-800 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-soft/20 dark:shadow-emerald-900/40">
            <Heart className="text-white w-8 h-8 flex-shrink-0" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-slate-100 tracking-tight">Sukoon</h1>
          <p className="text-gray-500 dark:text-gray-400">Your companion for mental wellness and inner peace.</p>
        </div>
        
        <div className="space-y-4 mt-8">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in duration-300">
              {error}
            </div>
          )}
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full py-4 text-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" referrerPolicy="no-referrer" />
            )}
            {loading ? "Connecting..." : "Continue with Google"}
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500 px-6">
            By continuing, you agree to our terms. This is a wellness tool, not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
}

function OnboardingView({ profile, lang, setLang, onComplete }: { profile: UserProfile, lang: Language, setLang: (l: Language) => void, onComplete: () => void }) {
  const [step, setStep] = useState(1);

  const finish = async () => {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, "users", profile.uid), {
        ...profile,
        preferredLanguage: lang,
        onboardingComplete: true
      }, { merge: true });
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-transparent relative z-10">
      <motion.div 
        key={step} 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {step === 1 ? (
          <>
            <h2 className="text-2xl font-bold dark:text-slate-100">{translations[lang].pickLanguage}</h2>
            <p className="text-gray-500 dark:text-gray-400">{translations[lang].home === 'होम' ? 'हम चाहते हैं कि सुकून घर जैसा लगे।' : (translations[lang].home === 'ہوم' ? 'ہم چاہتے ہیں کہ سکون گھر جیسا محسوس ہو۔' : 'We want Sukoon to feel like home.')}</p>
            <div className="grid grid-cols-1 gap-3">
              {(["en", "hi", "ur"] as const).map(l => (
                  <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      lang === l ? "border-primary-soft bg-pastel-green dark:bg-emerald-900/20" : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                    )}
                  >
                    <p className="font-bold capitalize dark:text-slate-200">{l === 'en' ? 'English' : (l === 'hi' ? 'Hindi (हिंदी)' : 'Urdu (اردو)')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{l === 'en' ? 'Default' : (l === 'hi' ? 'Suno, samjho aur bolo' : 'Suniye, samjhiye aur boliye')}</p>
                  </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="w-full py-4 bg-primary-soft text-white border-0">{translations[lang].continue}</Button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold dark:text-slate-100">{translations[lang].privacyPurpose}</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div className="flex gap-4">
                <ShieldAlert className="shrink-0 text-primary-soft dark:text-emerald-400" />
                <p className="text-sm">{translations[lang].privacyDescription}</p>
              </div>
              <div className="flex gap-4">
                <Heart className="shrink-0 text-primary-soft dark:text-emerald-400" />
                <p className="text-sm">{translations[lang].aiCompanionDescription}</p>
              </div>
              <div className="flex gap-4">
                <ShieldAlert className="shrink-0 text-primary-soft dark:text-emerald-400" />
                <p className="text-sm">{translations[lang].crisisRedirectDescription}</p>
              </div>
            </div>
            <Button onClick={finish} className="w-full py-4 bg-primary-soft text-white border-0">{translations[lang].finishSetup}</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ChatView({ profile, onNewIntervention, lang }: { profile: UserProfile, onNewIntervention: (i: Intervention) => void, lang: Language }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const t = translations[lang];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioRecording = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const text = await transcribeAudio(base64, 'audio/webm');
      if (text) {
        setInput(prev => prev ? `${prev} ${text}` : text);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setTranscribing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    
    // Crisis check
    const isCrisis = await detectCrisis(input);
    if (isCrisis) {
      setMessages(prev => [...prev, 
        { role: 'user', parts: [{ text: input }] },
        { role: 'model', parts: [{ text: "I'm hearing that you are going through something very difficult. Please know that your life matters. I'm a machine and cannot help directly in a crisis, but there are people who can. Please reach out to localized emergency services or a crisis helpline listed in the Support section." }] }
      ]);
      setInput("");
      return;
    }

    const userMsg: ChatMessage = { role: "user", parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await chatWithSukoon(messages, input, profile);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: response || "I'm here for you." }] }]);
      
      // Heuristic for intervention trigger
      if (input.toLowerCase().includes("help me relax") || input.toLowerCase().includes("panic") || input.toLowerCase().includes("stress")) {
        const intervention = await generateIntervention("anxious", input);
        if (intervention) onNewIntervention(intervention);
      }
    } catch (err) {
      if (err instanceof GeminiQuotaExceededError) {
        setMessages(prev => [...prev, { role: "model", parts: [{ text: "It seems I've reached my daily limit for conversations today. I'm taking a short rest, but please know you're not alone. I'll be back fresh tomorrow. Why not try one of the calming rituals in the 'Calm' section?" }] }]);
      } else {
        console.error(err);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent z-50 flex flex-col md:static md:inset-auto md:h-[80vh]">
      <header className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur shrink-0">
        <div className="flex flex-col">
          <span className="font-serif font-bold text-lg dark:text-slate-100">{t.talkItOut}</span>
          <span className="text-[10px] text-primary-soft uppercase tracking-widest font-bold">{t.safeSpace}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary-soft animate-pulse" />
           <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{t.listenerActive}</span>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="bg-pastel-green dark:bg-slate-800 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto rotate-3">
              <MessageSquare className="w-10 h-10 text-primary-soft -rotate-3" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="font-serif font-bold text-xl dark:text-slate-200">{t.listening}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">{t.ventScream}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {[t.overwhelmed, t.hardDay, t.justVent].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full text-xs text-gray-500 dark:text-gray-400 hover:border-primary-soft/20 dark:hover:border-slate-600 transition-all font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-[24px] relative",
              m.role === 'user' ? "bg-primary-soft text-white rounded-tr-none" : "bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-tl-none shadow-sm dark:text-slate-200"
            )}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.parts[0].text}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[20px] rounded-tl-none p-4 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary-soft" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-950 border-t dark:border-slate-800 shrink-0">
        {isRecording && (
          <div className="flex items-center justify-center mb-4 gap-4 bg-primary-soft/10 p-3 rounded-2xl animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary-soft" />
            <span className="text-[10px] font-bold text-primary-strong dark:text-primary-soft uppercase tracking-widest">Listening...</span>
          </div>
        )}
        <div className="flex gap-2 max-w-4xl mx-auto items-end">
          <div className="flex-1 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={transcribing ? "Listening to your voice..." : "Let it out..."}
              rows={1}
              disabled={transcribing}
              className="w-full bg-gray-50 dark:bg-slate-900 dark:text-slate-200 rounded-[20px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-soft/20 resize-none min-h-[48px] max-h-[120px] border-transparent transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="absolute right-2 bottom-2">
              {transcribing ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-soft m-1" />
              ) : (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isRecording ? "bg-primary-soft/20 text-primary-strong animate-pulse" : "bg-primary-soft/10 text-primary-soft hover:bg-primary-soft/20"
                  )}
                >
                  {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
          <Button 
            onClick={send} 
            disabled={!input.trim() || sending || transcribing || isRecording} 
            className="bg-primary-soft h-[44px] w-[44px] p-0 flex items-center justify-center rounded-2xl border-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MoodView({ onComplete, uid, lang }: { onComplete: () => void, uid: string, lang: Language }) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const t = translations[lang];

  const moodsList: { id: Mood, label: string }[] = [
    { id: 'happy', label: t.happy },
    { id: 'calm', label: t.calm },
    { id: 'neutral', label: t.neutral },
    { id: 'sad', label: t.sad },
    { id: 'stressed', label: t.stressed },
    { id: 'anxious', label: t.anxious },
  ];

  const save = async () => {
    if (!selectedMood) return;
    setSaving(true);
    const path = "moods";
    try {
      await addDoc(collection(db, "moods"), {
        uid,
        mood: selectedMood,
        intensity,
        note,
        timestamp: serverTimestamp()
      });
      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold">Track your mood</h2>
        <Button variant="ghost" onClick={onComplete}>Close</Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {moodsList.map(m => (
          <button 
            key={m.id}
            onClick={() => setSelectedMood(m.id)}
            className={cn(
              "flex flex-col items-center p-6 rounded-3xl border-2 transition-all",
              selectedMood === m.id ? "border-primary-soft bg-pastel-green" : "border-gray-50 bg-white"
            )}
          >
            <MoodIcon mood={m.id} className={cn("w-12 h-12 mb-2", selectedMood === m.id ? "text-primary-soft" : "text-gray-400")} />
            <span className={cn("font-medium", selectedMood === m.id ? "text-primary-strong" : "text-gray-500")}>{m.label}</span>
          </button>
        ))}
      </div>

      {selectedMood && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">How intense is this feeling? ({intensity}/10)</label>
            <input 
              type="range" min="1" max="10" 
              value={intensity} 
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-soft" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Add a note (Optional)</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
            />
          </div>
          <Button onClick={save} disabled={saving} className="w-full py-4 text-lg">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Mood Record"}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

function JournalView({ uid, lang, title, onSave }: { uid: string, lang: Language, title?: string, onSave?: () => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const q = query(collection(db, "journal"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as JournalEntry)
        .sort((a, b) => {
          const tA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date(0);
          const tB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setEntries(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "journal"));
  }, [uid]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const path = "journal";
    try {
      await addDoc(collection(db, "journal"), {
        uid,
        content,
        timestamp: serverTimestamp()
      });
      setContent("");
      setIsAdding(false);
      onSave?.();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold dark:text-slate-100">{title || t.yourJournal}</h2>
      </header>

      {isAdding ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <textarea 
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl min-h-[300px] shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:text-slate-200"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Entry"}
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <Button onClick={() => setIsAdding(true)} className="w-full py-6 text-xl border-dashed border-2 bg-transparent border-primary-soft/20 dark:border-primary-soft/10 text-primary-soft hover:bg-pastel-green dark:hover:bg-slate-800">
            <Plus /> New Reflection
          </Button>

          <div className="space-y-6 mt-8">
            {entries.map(entry => {
               const date = entry.timestamp instanceof Date ? entry.timestamp : (entry.timestamp as any).toDate?.() || new Date();
               return (
                <div key={entry.id} className="relative pl-6 border-l-2 border-primary-soft/10 pb-2">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary-soft opacity-50" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-2">
                    {format(date, 'MMM do, yyyy · HH:mm')}
                  </p>
                  <Card>
                    <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                  </Card>
                </div>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function MoodIcon({ mood, className }: { mood: Mood; className?: string }) {
  switch (mood) {
    case 'happy': return <Smile className={className} />;
    case 'sad': return <Frown className={className} />;
    case 'calm': return <Heart className={className} />;
    case 'stressed': return <Wind className={className} />;
    case 'anxious': return <ShieldAlert className={className} />;
    case 'neutral': return <Meh className={className} />;
    default: return <Meh className={className} />;
  }
}

function SettingsView({ profile, onLogout, lang, setLang }: { profile: UserProfile, onLogout: () => void, lang: Language, setLang: (l: Language) => void }) {
  const t = translations[lang];
  const [updating, setUpdating] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUpdating(Object.keys(updates)[0]);
    try {
      await setDoc(doc(db, "users", profile.uid), updates, { merge: true });
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <h2 className="text-4xl font-serif font-bold tracking-tight dark:text-slate-100">{t.settings}</h2>
        <p className="text-gray-500 font-medium dark:text-gray-400">Manage your path to peace.</p>
      </header>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-1">{t.account}</h3>
          <Card className="p-6 border-0 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary-soft/10 rounded-2xl flex items-center justify-center">
                  <UserIcon className="text-primary-soft w-6 h-6" />
               </div>
               <div>
                  <p className="font-bold dark:text-slate-200">{profile.displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{profile.email}</p>
               </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-1">{t.interface}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="p-6 border-0 shadow-sm space-y-4 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                   <Globe className="w-4 h-4 text-primary-soft dark:text-emerald-400" />
                   <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{t.preferredLanguage}</span>
                </div>
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-900 rounded-xl">
                   {['en', 'hi', 'ur'].map((l) => (
                     <button 
                       key={l}
                       onClick={() => {
                          setLang(l as any);
                          updateProfile({ preferredLanguage: l as any });
                       }}
                       className={cn(
                         "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                         lang === l ? "bg-white dark:bg-slate-700 text-primary-soft shadow-sm" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400"
                       )}
                     >
                       {l.toUpperCase()}
                     </button>
                   ))}
                </div>
             </Card>

             <Card className="p-6 border-0 shadow-sm space-y-4 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <CloudMoon className="w-4 h-4 text-primary-soft dark:text-emerald-400" />
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{t.cloudSync}</span>
                   </div>
                   <div className="w-8 h-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                   </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t.alwaysActive}</p>
             </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-1">{t.privacy}</h3>
          <Card className="p-6 border-0 shadow-sm bg-white dark:bg-slate-800">
             <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {t.privacyDescription}
             </p>
          </Card>
        </section>

        <Button 
          variant="secondary" 
          onClick={onLogout} 
          className="w-full py-8 rounded-3xl border-red-50 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900/10 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300 transition-all font-bold group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t.signOut}
        </Button>

        <div className="text-center pt-8">
          <p className="text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-[0.3em] font-bold">
            Sukoon · Inner Peace Starts Within
          </p>
        </div>
      </div>
    </div>
  );
}

function Navigation({ view, setView, lang, sukoonMode }: { view: string, setView: (v: any) => void, lang: Language, sukoonMode: boolean }) {
  const t = translations[lang];
  const items = [
    { id: 'home', icon: Heart, label: t.home },
    { id: 'talk', icon: MessageSquare, label: t.talk },
    { id: 'calm', icon: CalmIcon, label: t.calm },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <>
      {/* Desktop Rail */}
      <nav className={cn(
        "hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 gap-8 shadow-sm transition-colors duration-700 z-50",
        sukoonMode ? "bg-slate-900 border-r border-slate-800" : "bg-white border-r border-gray-100"
      )}>
        <div className="bg-primary-soft p-3 rounded-2xl mb-4 text-white shadow-md shadow-primary-soft/20">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              view === item.id 
                ? (sukoonMode ? "bg-slate-800 text-slate-200" : "bg-primary-soft/10 text-primary-soft")
                : (sukoonMode ? "text-slate-600 hover:text-slate-400" : "text-gray-300 hover:text-primary-soft/60")
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="absolute left-full ml-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Mobile Bar */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-4 z-40 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.02)] transition-colors duration-700",
        sukoonMode ? "bg-slate-900/90 border-t border-slate-800" : "bg-white/90 border-t border-gray-50"
      )}>
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={cn( "p-2 transition-all", 
              view === item.id 
                ? (sukoonMode ? "text-slate-200 scale-110" : "text-primary-soft scale-110")
                : (sukoonMode ? "text-slate-600" : "text-gray-300")
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </>
  );
}

function CrisisModal({ isOpen, onClose, lang }: { isOpen: boolean, onClose: () => void, lang: Language }) {
  if (!isOpen) return null;
  const t = translations[lang];

  const resources = [
    { country: 'India', hotline: 'Vandrevala Foundation (1860-266-2345)', description: '24/7 mental health help' },
    { country: 'Pakistan', hotline: 'Umang (0311-7786264)', description: 'Psychotherapy and support' },
    { country: 'Bangladesh', hotline: 'Kaanpetey Roi (01779310652)', description: '24/7 listening service' },
    { country: 'International', hotline: 'Befrienders Worldwide', description: 'Global suicide prevention network' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-lg w-full relative z-[101] shadow-2xl dark:shadow-black/50"
      >
        <div className="text-center mb-8">
          <div className="bg-primary-soft/10 dark:bg-emerald-900/30 text-primary-strong dark:text-emerald-400 p-4 rounded-full w-fit mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-slate-100">{t.youAreNotAlone}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t.crisisHelpDescription}</p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {resources.map(res => (
            <div key={res.country} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900 dark:text-slate-200">{res.country}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{res.description}</p>
              </div>
              <p className="text-primary-soft dark:text-emerald-400 font-mono font-bold text-xs">{res.hotline}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest font-bold">{t.emergencyCall}</p>
          <Button onClick={onClose} className="w-full py-4 bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-200 hover:bg-black dark:hover:bg-slate-700 rounded-2xl">{t.iUnderstand}</Button>
        </div>
      </motion.div>
    </div>
  );
}
