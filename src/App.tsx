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
  Repeat
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
import { cn } from "./lib/utils";
import { Mood, UserProfile, MoodEntry, JournalEntry, Goal, ChatMessage, MemoryEntry, DecisionSession, Intervention, FutureMeMessage } from "./types";
import { chatWithSukoon, detectCrisis, transcribeAudio, detectPatterns, generateIntervention, structureDecision } from "./services/gemini";

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' }) => {
  const variants = {
    primary: "bg-primary-soft text-white hover:bg-primary-strong",
    secondary: "bg-pastel-green text-primary-strong hover:bg-primary-soft/20",
    danger: "bg-primary-strong/20 text-primary-strong hover:bg-primary-strong/30",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    outline: "bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50"
  };
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2", 
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-primary-soft/5", className)} {...props}>
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
      className="fixed inset-0 z-[100] bg-primary-strong/95 backdrop-blur-xl flex items-center justify-center p-6 text-center text-white"
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
      <h2 className="text-3xl font-serif">Emotional Patterns</h2>
      <p className="text-gray-500 text-sm italic italic-small">Reflections from your recent journey.</p>
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
        <h2 className="text-3xl font-serif">Decision Clarity</h2>
        <p className="text-gray-500 text-sm italic-small italic">STRUCTURE THINKING, DON'T OVERTHINK IT.</p>
      </header>

      <div className="space-y-4">
        <textarea 
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="What's weighing on your mind?"
          className="w-full bg-white rounded-3xl p-6 text-sm border focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[120px] shadow-sm"
        />
        <Button onClick={() => onAnalyze(problem)} disabled={!problem.trim()} className="w-full bg-emerald-600 text-white h-14 rounded-3xl">
          Analyze Perspectives
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-2">Past Sessions</h3>
        {decisions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No past sessions yet.</p>
        ) : (
          decisions.map((d, i) => (
            <Card key={i} className="group hover:border-emerald-200 cursor-pointer">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="font-bold line-clamp-1">{d.problem}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{format(d.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
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
}

const FutureMeView = ({ messages, onPlay, uid }: FutureMeViewProps) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [type, setType] = useState<'text' | 'audio' | 'video'>('text');
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const prompts = [
    "What do you want to remind yourself when things feel too much?",
    "What is something true about you that you forget when you're upset?",
    "What helped you last time you felt like this?",
    "Describe the peace you feel right now."
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
    if (!content.trim() || tags.length === 0) return;
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
          <h2 className="text-3xl font-serif">Future Me Support</h2>
          <p className="text-gray-500 text-sm italic-small italic">Messages from your stable self.</p>
        </div>
        <Button onClick={() => setMode(mode === 'list' ? 'create' : 'list')} variant="secondary">
          {mode === 'list' ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {mode === 'list' ? 'Record New' : 'Cancel'}
        </Button>
      </header>

      {mode === 'create' ? (
        <Card className="space-y-6 overflow-hidden">
          <div className="bg-primary-soft/5 p-4 rounded-2xl border border-primary-soft/10">
            <p className="text-sm font-serif italic text-primary-strong">"{activePrompt}"</p>
          </div>

          <div className="flex gap-2">
            {(['text', 'audio', 'video'] as const).map(t => (
              <button 
                key={t}
                onClick={() => { setType(t); setContent(""); }}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-medium transition-all capitalize",
                  type === t ? "bg-primary-soft border-primary-soft text-white" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
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
              className="w-full min-h-[150px] p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary-soft/20 outline-none text-sm"
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
              <Card className="text-center py-12 text-gray-400 space-y-4">
                <Archive className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-sm">No messages stored yet. Create one while you feel stable.</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {messages.map(m => (
                  <Card key={m.id} className="p-4 hover:border-primary-soft/20 cursor-pointer group flex items-center justify-between" onClick={() => onPlay(m)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft/10 text-primary-soft flex items-center justify-center">
                        {m.type === 'video' ? <Video className="w-5 h-5" /> : (m.type === 'audio' ? <Volume2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex gap-1 flex-wrap">
                          {m.tags.map(t => <span key={t} className="text-[8px] font-bold bg-primary-soft/10 text-primary-strong px-1.5 py-0.5 rounded-full uppercase">{t}</span>)}
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">{format(m.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-gray-300 group-hover:text-primary-soft transition-colors" />
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
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'talk' | 'calm' | 'future-me' | 'journal' | 'growth' | 'settings'>('home');
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

  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile
        const path = `users/${u.uid}`;
        try {
          const docRef = doc(db, "users", u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // New user - default profile
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
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listeners
  useEffect(() => {
    if (!user) return;

    const moodsQ = query(
      collection(db, "moods"), 
      where("uid", "==", user.uid), 
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const moodUnsub = onSnapshot(moodsQ, (snap) => {
      setMoods(snap.docs.map(d => ({ id: d.id, ...d.data() }) as MoodEntry));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "moods"));

    const journalQ = query(
      collection(db, "journal"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const journalUnsub = onSnapshot(journalQ, (snap) => {
      setJournalEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }) as JournalEntry));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "journal"));

    const goalsQ = query(collection(db, "goals"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
    const goalsUnsub = onSnapshot(goalsQ, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Goal));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "goals"));

    const memoriesQ = query(collection(db, "memories"), where("uid", "==", user.uid), orderBy("lastTriggered", "desc"), limit(5));
    const memoriesUnsub = onSnapshot(memoriesQ, (snap) => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() }) as MemoryEntry));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "memories"));

    const decisionsQ = query(collection(db, "decisions"), where("uid", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
    const decisionsUnsub = onSnapshot(decisionsQ, (snap) => {
      setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() }) as DecisionSession));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "decisions"));

    const futureMeQ = query(collection(db, "futureMeMessages"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
    const futureMeUnsub = onSnapshot(futureMeQ, (snap) => {
      setFutureMeMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as FutureMeMessage));
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
        setView('growth');
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-cream gap-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary-soft" />
          <div className="absolute inset-0 blur-xl bg-primary-soft/20 animate-pulse" />
        </div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 animate-pulse">finding peace...</p>
      </div>
    );
  }

  if (!user) return <LoginView />;

  if (profile && !profile.onboardingComplete) {
    return <OnboardingView profile={profile} onComplete={() => setProfile(p => p ? ({ ...p, onboardingComplete: true }) : null)} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-gray-900 pb-24 md:pb-0 md:pl-20">
      {/* Sidebar / Bottom Nav */}
      <Navigation view={view} setView={setView} />

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <header className="flex justify-between items-start">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif font-bold text-gray-900 leading-tight">
                    {profile?.displayName?.split(' ')[0]},
                  </h1>
                  <p className="text-gray-500 font-medium">Breathe in. You are here.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setView('settings')} className="rounded-2xl h-12 w-12 p-0 bg-white border-gray-100">
                    <Settings className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </header>

              {/* SOS - The visceral lifeline */}
              <motion.button 
                whileHover={{ scale: 1.01, boxShadow: "0 20px 25px -5px rgb(74 139 113 / 0.1), 0 8px 10px -6px rgb(74 139 113 / 0.1)" }}
                whileTap={{ scale: 0.99 }}
                onClick={startPanicMode}
                className="w-full bg-primary-strong text-white p-6 rounded-[32px] flex items-center justify-between group transition-all shadow-xl shadow-primary-soft/10"
              >
                <div className="text-left">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 text-white/80">Instant Help</span>
                  <h2 className="text-2xl font-serif font-bold">I'm not okay</h2>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform"
                >
                  <AlertOctagon className="w-8 h-8" />
                </motion.div>
              </motion.button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Future Me - Primary Lifeline */}
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-pastel-green border-0 p-8 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden group h-full">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-serif font-bold mb-2 text-primary-strong">My Anchor</h3>
                      <p className="text-primary-soft/80 text-sm leading-relaxed mb-6">
                        Hear your own voice from a calmer time.
                      </p>
                    </div>
                    <div className="relative z-10 flex gap-2">
                      {futureMeMessages.length > 0 ? (
                        <Button 
                          onClick={() => setActivePlaybackMessage(futureMeMessages[Math.floor(Math.random() * futureMeMessages.length)])}
                          className="bg-primary-soft text-white hover:bg-primary-strong w-full h-14 rounded-2xl border-0 shadow-lg shadow-primary-soft/20"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          Play Lifeline
                        </Button>
                      ) : (
                        <Button onClick={() => setView('future-me')} className="bg-primary-soft text-white hover:bg-primary-strong w-full h-14 rounded-2xl border-0 shadow-lg shadow-primary-soft/20">
                          Record your first anchor
                        </Button>
                      )}
                    </div>
                    <Anchor className="absolute top-0 right-0 w-44 h-44 text-primary-soft/10 -rotate-12 translate-x-12 -translate-y-12 transition-transform group-hover:scale-110 duration-500" />
                  </Card>
                </motion.div>

                {/* Talk It Out */}
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-pastel-green border-0 p-8 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden group h-full">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-serif font-bold mb-2 text-primary-strong">Let it out</h3>
                      <p className="text-primary-soft/80 text-sm leading-relaxed mb-6">
                        No judgment. No filters. Just vent to Sukoon.
                      </p>
                    </div>
                    <Button onClick={() => setView('talk')} className="relative z-10 bg-primary-soft text-white hover:bg-primary-strong w-full h-14 rounded-2xl border-0 shadow-lg shadow-primary-soft/20">
                      <MessageSquare className="w-5 h-5" />
                      Talk it out
                    </Button>
                    <MessageCircle className="absolute top-0 right-0 w-44 h-44 text-primary-soft/10 -rotate-12 translate-x-12 -translate-y-12 transition-transform group-hover:scale-110 duration-500" />
                  </Card>
                </motion.div>
              </div>

              {/* Quick Relief - High engagement, low effort */}
              <section className="bg-pastel-green border border-primary-soft/10 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 text-center md:text-left shadow-sm">
                <div className="bg-white p-4 rounded-3xl shadow-sm">
                  <Timer className="w-10 h-10 text-primary-soft" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-primary-strong">Need 60s of calm?</h3>
                  <p className="text-primary-soft/70 text-sm font-medium">Guided breathing and grounding for an instant reset.</p>
                </div>
                <Button 
                  onClick={async () => {
                    const intervention = await generateIntervention("anxiety", "quick reset requested from home");
                    if (intervention) setActiveIntervention(intervention);
                  }}
                  className="bg-primary-soft text-white hover:bg-primary-strong h-14 px-8 rounded-2xl w-full md:w-auto border-0"
                >
                  Start Reset
                </Button>
              </section>

              {/* Silent mode toggle */}
              <div className="flex justify-center">
                <button 
                  onClick={toggleSilentMode}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-full border transition-all shadow-sm",
                    profile?.silentMode ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-100 hover:border-primary-soft/30 hover:text-primary-soft"
                  )}
                >
                  <CloudMoon className={cn("w-5 h-5", profile?.silentMode && "text-primary-soft")} />
                  <span className="text-xs font-bold uppercase tracking-widest leading-none">
                    {profile?.silentMode ? "Silent Mode Active" : "Go Silent"}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {view === 'talk' && <ChatView profile={profile!} onNewIntervention={(i) => setActiveIntervention(i)} />}
          {view === 'calm' && (
             <div className="p-6 space-y-12">
               <header className="space-y-2">
                 <h2 className="text-4xl font-serif">Quiet the Noise</h2>
                 <p className="text-gray-500">Fast interventions for difficult moments.</p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Panic attack", mood: "panic" },
                    { label: "Can't sleep", mood: "insomnia" },
                    { label: "Endless scrolling", mood: "distracted" },
                    { label: "Heavy chest", mood: "heavy" }
                  ].map(item => (
                    <Card key={item.label} className="p-8 hover:border-primary-soft/30 cursor-pointer group" onClick={async () => {
                      const inter = await generateIntervention(item.mood as any, item.label);
                      if (inter) setActiveIntervention(inter);
                    }}>
                       <div className="flex justify-between items-center">
                         <span className="text-lg font-bold">{item.label}</span>
                         <Plus className="w-5 h-5 text-primary-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                    </Card>
                  ))}
               </div>
               <MoodView onComplete={() => setView('home')} uid={user.uid} />
             </div>
          )}
          {view === 'journal' && <JournalView uid={user.uid} />}
          {view === 'future-me' && (
            <FutureMeView 
              messages={futureMeMessages} 
              onPlay={(msg) => setActivePlaybackMessage(msg)}
              uid={user.uid}
            />
          )}
          {view === 'settings' && <SettingsView profile={profile!} onLogout={logout} />}
          {view === 'growth' && (
            <div className="p-6 space-y-12">
               <header className="space-y-2">
                 <h2 className="text-4xl font-serif">Healing Graph</h2>
                 <p className="text-gray-500">Untangling the patterns of your journey.</p>
               </header>
               <InsightsView memories={memories} />
               <div className="border-t pt-12">
                 <h3 className="text-xl font-bold mb-6">Untangle Thinking</h3>
                 <DecisionView decisions={decisions} onAnalyze={onAnalyzeDecision} />
               </div>
            </div>
          )}
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
      <CrisisModal isOpen={isCrisisModalOpen} onClose={() => setIsCrisisModalOpen(false)} />
    </div>
  );
}

// --- Views ---

function LoginView() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-[#FDFCF9]">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-2">
          <div className="bg-primary-soft w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-soft/20">
            <Heart className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Sukoon</h1>
          <p className="text-gray-500">Your companion for mental wellness and inner peace.</p>
        </div>
        
        <div className="space-y-4 mt-8">
          <Button onClick={loginWithGoogle} className="w-full py-4 text-lg bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" referrerPolicy="no-referrer" />
            Continue with Google
          </Button>
          <p className="text-xs text-gray-400 px-6">
            By continuing, you agree to our terms. This is a wellness tool, not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
}

function OnboardingView({ profile, onComplete }: { profile: UserProfile, onComplete: () => void }) {
  const [lang, setLang] = useState<"en" | "hi" | "ur">("en");
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
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-[#FDFCF9]">
      <motion.div 
        key={step} 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {step === 1 ? (
          <>
            <h2 className="text-2xl font-bold">Pick your language</h2>
            <p className="text-gray-500">We want Sukoon to feel like home.</p>
            <div className="grid grid-cols-1 gap-3">
              {(["en", "hi", "ur"] as const).map(l => (
                  <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all",
                      lang === l ? "border-primary-soft bg-pastel-green" : "border-gray-100 bg-white"
                    )}
                  >
                    <p className="font-bold capitalize">{l === 'en' ? 'English' : (l === 'hi' ? 'Hindi (हिंदी)' : 'Urdu (اردو)')}</p>
                    <p className="text-xs text-gray-500">{l === 'en' ? 'Default' : (l === 'hi' ? 'Suno, samjho aur bolo' : 'Suniye, samjhiye aur boliye')}</p>
                  </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="w-full py-4 bg-primary-soft text-white border-0">Continue</Button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">Privacy & Purpose</h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex gap-4">
                <ShieldAlert className="shrink-0 text-primary-soft" />
                <p className="text-sm">Your data is private. We don't share your journal or chat history with anyone.</p>
              </div>
              <div className="flex gap-4">
                <Heart className="shrink-0 text-primary-soft" />
                <p className="text-sm">Sukoon is an AI companion for emotional support, not a clinical therapist.</p>
              </div>
              <div className="flex gap-4">
                <ShieldAlert className="shrink-0 text-primary-soft" />
                <p className="text-sm">If you are in danger, please use the Support red button to find help.</p>
              </div>
            </div>
            <Button onClick={finish} className="w-full py-4 bg-primary-soft text-white border-0">Finish Setup</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ChatView({ profile, onNewIntervention }: { profile: UserProfile, onNewIntervention: (i: Intervention) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDFCF9] z-50 flex flex-col md:static md:inset-auto md:h-[80vh]">
      <header className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur shrink-0">
        <div className="flex flex-col">
          <span className="font-serif font-bold text-lg">Talk it out</span>
          <span className="text-[10px] text-primary-soft uppercase tracking-widest font-bold">Safe Space</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary-soft animate-pulse" />
           <span className="text-[10px] uppercase font-bold text-gray-400">Listener Active</span>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="bg-pastel-green w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto rotate-3">
              <MessageSquare className="w-10 h-10 text-primary-soft -rotate-3" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="font-serif font-bold text-xl">I'm listening.</h3>
              <p className="text-sm text-gray-400 leading-relaxed">No judgment. No filters. Just vent, scream, or cry. Start by letting it all out.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {["I feel overwhelmed", "I'm having a hard day", "I just need to vent"].map(t => (
                <button 
                  key={t}
                  onClick={() => setInput(t)}
                  className="px-4 py-2 bg-white border border-gray-100 rounded-full text-xs text-gray-500 hover:border-primary-soft/20 transition-all font-medium"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-[24px] relative",
              m.role === 'user' ? "bg-primary-soft text-white rounded-tr-none" : "bg-white border rounded-tl-none shadow-sm"
            )}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.parts[0].text}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-[20px] rounded-tl-none p-4 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary-soft" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t shrink-0">
        {isRecording && (
          <div className="flex items-center justify-center mb-4 gap-4 bg-primary-soft/10 p-3 rounded-2xl animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary-soft" />
            <span className="text-[10px] font-bold text-primary-strong uppercase tracking-widest">Listening...</span>
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
              className="w-full bg-gray-50 rounded-[20px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-soft/20 resize-none min-h-[48px] max-h-[120px] border-transparent transition-all"
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

function MoodView({ onComplete, uid }: { onComplete: () => void, uid: string }) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const moodsList: { id: Mood, label: string }[] = [
    { id: 'happy', label: 'Happy' },
    { id: 'calm', label: 'Calm' },
    { id: 'neutral', label: 'Neutral' },
    { id: 'sad', label: 'Sad' },
    { id: 'stressed', label: 'Stressed' },
    { id: 'anxious', label: 'Anxious' },
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

function JournalView({ uid }: { uid: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "journal"), where("uid", "==", uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }) as JournalEntry));
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
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold">Your Journal</h2>
      </header>

      {isAdding ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <textarea 
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full p-6 bg-white border border-gray-100 rounded-3xl min-h-[300px] shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
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
          <Button onClick={() => setIsAdding(true)} className="w-full py-6 text-xl border-dashed border-2 bg-transparent border-primary-soft/20 text-primary-soft hover:bg-pastel-green">
            <Plus /> New Reflection
          </Button>

          <div className="space-y-6 mt-8">
            {entries.map(entry => {
               const date = entry.timestamp instanceof Date ? entry.timestamp : (entry.timestamp as any).toDate?.() || new Date();
               return (
                <div key={entry.id} className="relative pl-6 border-l-2 border-primary-soft/10 pb-2">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary-soft" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    {format(date, 'MMM do, yyyy · HH:mm')}
                  </p>
                  <Card>
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
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

function SettingsView({ profile, onLogout }: { profile: UserProfile, onLogout: () => void }) {
  return (
    <div className="p-6 space-y-12">
      <header className="space-y-2">
        <h2 className="text-4xl font-serif font-bold">Settings</h2>
        <p className="text-gray-500">Manage your profile and app preferences.</p>
      </header>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Account</h3>
          <Card className="divide-y divide-gray-100 p-0 overflow-hidden border-gray-100">
            <div className="p-6 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{profile.displayName}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
              <UserIcon className="w-10 h-10 text-gray-200 bg-gray-50 p-2 rounded-full" />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">App Preferences</h3>
          <Card className="divide-y divide-gray-100 p-0 overflow-hidden border-gray-100">
            <div className="p-6 flex justify-between items-center">
              <div>
                <p className="font-bold">Preferred Language</p>
                <p className="text-sm text-gray-500">Language for AI responses</p>
              </div>
              <span className="text-primary-soft font-bold uppercase">{profile.preferredLanguage}</span>
            </div>
            <div className="p-6 flex justify-between items-center opacity-50">
              <div>
                <p className="font-bold">Cloud Sync</p>
                <p className="text-sm text-gray-500">Always active</p>
              </div>
              <CloudMoon className="w-5 h-5 text-primary-soft" />
            </div>
          </Card>
        </section>

        <section className="pt-8">
          <Button variant="outline" onClick={onLogout} className="w-full h-14 rounded-2xl border-primary-soft/20 text-primary-strong hover:bg-primary-soft/5 hover:border-primary-soft/40 shadow-sm transition-all border-2">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </section>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Sukoon v1.0.0 · Your life matters.</p>
      </div>
    </div>
  );
}

function Navigation({ view, setView }: { view: string, setView: (v: any) => void }) {
  const items = [
    { id: 'home', icon: Heart, label: 'Pulse' },
    { id: 'talk', icon: MessageSquare, label: 'Talk' },
    { id: 'calm', icon: CalmIcon, label: 'Calm' },
    { id: 'future-me', icon: Anchor, label: 'Future Me' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'growth', icon: Repeat, label: 'Growth' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Rail */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-100 flex-col items-center py-8 gap-8 shadow-sm">
        <div className="bg-primary-soft p-3 rounded-2xl mb-4 text-white shadow-md shadow-primary-soft/20">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              view === item.id ? "bg-primary-soft/10 text-primary-soft" : "text-gray-300 hover:text-primary-soft/60"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50 flex justify-around p-4 z-40 backdrop-blur-md bg-white/90 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={cn( "p-2 transition-all", view === item.id ? "text-primary-soft scale-110" : "text-gray-300" )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </>
  );
}

function CrisisModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  const resources = [
    { country: 'India', hotline: 'Vandrevala Foundation (1860-266-2345)', description: '24/7 mental health help' },
    { country: 'Pakistan', hotline: 'Umang (0311-7786264)', description: 'Psychotherapy and support' },
    { country: 'Bangladesh', hotline: 'Kaanpetey Roi (01779310652)', description: '24/7 listening service' },
    { country: 'International', hotline: 'Befrienders Worldwide', description: 'Global suicide prevention network' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-[101] shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="bg-primary-soft/10 text-primary-strong p-4 rounded-full w-fit mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">You are not alone.</h2>
          <p className="text-gray-600 mt-2">If you are in immediate danger or considering self-harm, please reach out to one of the following resources.</p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {resources.map(res => (
            <div key={res.country} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{res.country}</p>
                <p className="text-xs text-gray-500">{res.description}</p>
              </div>
              <p className="text-primary-soft font-mono font-bold">{res.hotline}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">In an emergency, please call 112 / 999 or go to the nearest hospital.</p>
          <Button onClick={onClose} className="w-full py-4 bg-gray-900 text-white hover:bg-black rounded-2xl">I understand</Button>
        </div>
      </motion.div>
    </div>
  );
}
