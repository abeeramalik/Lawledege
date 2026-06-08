import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import RagAvatar from '../../Components/RagAvatar';
import { lawledgeAgent } from './GroqService';

const AgentInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [avatarState, setAvatarState] = useState('idle');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const scrollRef = useRef(null);
  const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text) => {
    if (!text || !synthesis) return;
    
    // Stop any existing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => {
      setAvatarState('speaking');
    };
    utterance.onend = () => {
      setAvatarState('idle');
    };
    utterance.onerror = () => {
      setAvatarState('idle');
    };
    
    if (isTtsEnabled) {
      synthesis.speak(utterance);
    } else {
      // If TTS is disabled, we still want the avatar to "speak" for a bit 
      setAvatarState('speaking');
      setTimeout(() => setAvatarState('idle'), 3000);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || avatarState === 'thinking') return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAvatarState('thinking');

    try {
      const response = await lawledgeAgent.getChatResponse([...messages, userMessage]);
      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Check if response is an error message
      if (response.includes("System configuration mismatch") || response.includes("currently busy")) {
        setAvatarState('idle');
      } else {
        speak(response);
      }
    } catch (error) {
      console.error("Chat Handler Error:", error);
      const errorMessage = { role: 'assistant', content: "An unexpected error occurred. Please check the browser console for details." };
      setMessages(prev => [...prev, errorMessage]);
      setAvatarState('idle');
    }
  };

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')?.content;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Premium Header */}
      <header className="px-4 md:px-6 py-4 border-b border-amber-100 flex items-center justify-between bg-white/95 backdrop-blur-md z-30 shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-md shadow-amber-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-black tracking-tighter text-slate-900 italic leading-none">LAWLEDGE GUIDE</h1>
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Multan Premium Protocol</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setMessages([])}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className={`p-2 rounded-xl transition-all shadow-sm ${isTtsEnabled ? 'bg-amber-400 text-white hover:bg-amber-500' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {isTtsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Responsive Framework */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-amber-400/[0.03] rounded-full blur-[120px] pointer-events-none z-0" />

        {/* COMPANION SIDE-PANEL: Interactive Avatar Dashboard */}
        <div className="w-full md:w-[360px] lg:w-[420px] shrink-0 bg-white md:border-r border-b md:border-b-0 border-amber-100/70 p-4 md:p-8 flex flex-col items-center justify-center md:justify-start z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
          
          <div className="flex md:flex-col items-center gap-4 md:gap-6 w-full md:mt-4">
            
            {/* Interactive Avatar Base Wrapper */}
            <div className="relative shrink-0 p-1 bg-gradient-to-b from-amber-100 to-transparent rounded-full shadow-inner">
              <div className="p-2 bg-white rounded-full shadow-md">
                <RagAvatar state={avatarState} className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 transform transition-transform hover:scale-105" />
              </div>
              
              {/* Thinking Indicator Dots */}
              <AnimatePresence>
                {avatarState === 'thinking' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-2 left-0 w-full flex justify-center space-x-1 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-800 shadow-lg"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar Real-time Meta Block */}
            <div className="flex-1 md:flex-initial flex flex-col items-start md:items-center w-full min-w-0">
              <AnimatePresence mode="wait">
                {avatarState === 'speaking' && lastAssistantMessage ? (
                  <motion.div 
                    key="speech-bubble"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full bg-amber-50/60 border border-amber-200/80 px-4 py-3 md:p-5 rounded-2xl md:rounded-3xl shadow-sm text-left md:text-center mt-1 md:mt-2 max-h-[70px] md:max-h-[220px] overflow-y-auto custom-scrollbar relative hidden sm:block"
                  >
                    <p className="text-xs md:text-sm font-bold text-amber-900 leading-relaxed italic line-clamp-2 md:line-clamp-none">
                      "{lastAssistantMessage}"
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="status-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-inner flex items-center space-x-2 w-fit"
                  >
                    <span className={`w-2 h-2 rounded-full ${avatarState === 'thinking' ? 'bg-amber-400 animate-pulse' : avatarState === 'speaking' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">
                      {avatarState === 'idle' ? 'Ready' : avatarState === 'thinking' ? 'Analyzing laws' : 'Responding'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CHAT LOG STREAM & FLOATING INPUT PANELS */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10 min-h-0">
          
          {/* Thread List Feed */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scroll-smooth custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="text-center py-8 md:py-16 space-y-6 max-w-xl mx-auto">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 bg-amber-100/60 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Civic System Active</span>
                  </div>
                  <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed italic px-4">
                    "Assalam-o-Alaikum! I am your Lawledge Guide. Ask me about the CP Act 2005, Article 25A, or local civic matters across Multan."
                  </p>
                </div>
                
                {/* Fixed Prompt Option Buttons (Urdu and English Mix) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 px-4">
                  <button 
                    onClick={() => { setInput("What are consumer rights in Punjab?"); }}
                    className="px-5 py-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left flex items-center justify-between group"
                  >
                    <span dir="rtl" className="font-semibold">پنجاب میں صارفین کے حقوق (Consumer Rights)</span>
                    <div className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 shrink-0">
                      <Send className="w-2.5 h-2.5 text-amber-600" />
                    </div>
                  </button>
                  <button 
                    onClick={() => { setInput("Animal welfare laws in Pakistan"); }}
                    className="px-5 py-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left flex items-center justify-between group"
                  >
                    <span dir="rtl" className="font-semibold">تحفظِ حیوانات کے قوانین (Animal Welfare)</span>
                    <div className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 shrink-0">
                      <Send className="w-2.5 h-2.5 text-amber-600" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Render Stacked Messages */}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative transition-all
                  ${msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none shadow-md shadow-slate-900/5' 
                    : 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-none'}
                `}>
                  <div className="prose prose-sm prose-slate max-w-none font-medium break-words">
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Official Protocol</span>
                      <button 
                        onClick={() => speak(msg.content)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* HIGH VISIBILITY LOCKED INPUT PANEL */}
          <footer className="p-4 md:p-6 bg-white border-t border-slate-200 shadow-[0_-10px_35px_rgba(0,0,0,0.04)] shrink-0 z-20">
            <form 
              onSubmit={handleSend}
              className="relative flex items-center max-w-4xl mx-auto"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Lawledge... e.g. Hussain Agahi heritage"
                className="w-full bg-white border-2 border-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-slate-900 rounded-2xl px-5 md:px-6 py-4 pr-16 text-sm font-bold focus:outline-none transition-all placeholder:text-slate-400 shadow-md"
              />
              <div className="absolute right-2.5">
                <button
                  type="submit"
                  disabled={!input.trim() || avatarState === 'thinking'}
                  className="w-10 h-10 md:w-11 md:h-11 bg-amber-400 text-white rounded-xl shadow-md shadow-amber-400/20 disabled:opacity-40 disabled:shadow-none hover:bg-amber-500 transition-all active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            </form>
            <p className="text-center mt-3 text-[8px] font-black uppercase text-slate-400 tracking-[0.25em] font-mono block">
              Multan Digital Civic Infrastructure • v2.0.1
            </p>
          </footer>

        </div>
      </main>

      {/* Embedded Global Scrollbar Fixes */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default AgentInterface;