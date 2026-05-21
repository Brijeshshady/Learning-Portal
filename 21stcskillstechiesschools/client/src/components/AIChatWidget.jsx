import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Maximize2, Send, Bot, User, 
  Sparkles, Mic, Image as ImageIcon, ArrowRight,
  TrendingUp, BookOpen, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addNotification } from '../lib/store';

const parseInlineBold = (str) => {
  if (!str) return '';
  const boldParts = str.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bp, bpi) => {
    if (bp.startsWith('**') && bp.endsWith('**')) {
      return <strong key={bpi} className="font-extrabold text-white">{bp.substring(2, bp.length - 2)}</strong>;
    }
    // Handle inline code `code`
    const codeParts = bp.split(/(`.*?`)/g);
    return codeParts.map((cp, cpi) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={cpi} className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 font-bold">{cp.substring(1, cp.length - 1)}</code>;
      }
      return cp;
    });
  });
};

const RenderMarkdown = ({ text }) => {
  if (!text) return null;

  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const firstLine = lines[0];
          const lang = firstLine.replace('```', '').trim() || 'code';
          const code = lines.slice(1, -1).join('\n');
          
          return (
            <div key={index} className="my-3 bg-zinc-950/90 border border-white/5 rounded-xl p-3 font-mono text-xs overflow-x-auto text-emerald-400 relative">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2 font-sans font-black">
                <span>{lang}</span>
              </div>
              <pre className="whitespace-pre overflow-x-auto leading-relaxed">{code}</pre>
            </div>
          );
        } else {
          const lines = part.split('\n');
          return lines.map((line, lineIndex) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lineIndex} className="h-2" />;

            if (trimmed.startsWith('###')) {
              return <h4 key={lineIndex} className="text-xs font-black text-white mt-3 mb-1 uppercase tracking-wider">{trimmed.replace('###', '').trim()}</h4>;
            }
            if (trimmed.startsWith('##')) {
              return <h3 key={lineIndex} className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-wider">{trimmed.replace('##', '').trim()}</h3>;
            }
            if (trimmed.startsWith('#')) {
              return <h2 key={lineIndex} className="text-base font-black text-white mt-4 mb-2 uppercase tracking-wider">{trimmed.replace('#', '').trim()}</h2>;
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const content = trimmed.substring(2);
              return (
                <div key={lineIndex} className="flex items-start gap-2 pl-1.5 text-zinc-300 text-xs">
                  <span className="text-secondary mt-1.5 shrink-0 w-1 h-1 rounded-full bg-secondary" />
                  <span className="leading-relaxed">{parseInlineBold(content)}</span>
                </div>
              );
            }

            return <p key={lineIndex} className="text-zinc-300 leading-relaxed text-xs">{parseInlineBold(line)}</p>;
          });
        }
      })}
    </div>
  );
};

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      let welcomeMsg = `Hi ${user.name}! I am your 21stc AI Mentor. How can I help you today?`;
      let initialSuggestions = ["Tell me about Python", "What is Robotics?", "What are Neural Networks?", "My Weekly Roadmap"];
      
      if (user.role === 'admin') {
        welcomeMsg = `Hello ${user.name} (Super Admin). I am connected to the 21stc System Engine. How can I assist you with system monitoring, license deployment, or diagnostic actions today?`;
        initialSuggestions = ["Check Cluster Health", "Review AI Keys Status", "Show Diagnostics Commands"];
      } else if (user.role === 'school-admin') {
        welcomeMsg = `Hello ${user.name} (Hub Admin). I am connected to your school's database. I can assist you with managing institution users, student/teacher enrollment quotas, system license codes, or status reports. How can I help you?`;
        initialSuggestions = ["Show Hub Quotas", "Active License Status", "Maintenance Modes Info"];
      } else if (user.role === 'teacher') {
        welcomeMsg = `Hello ${user.name} (Teacher Assistant). I am your instructional AI assistant. I can help you with student roster analytics, grading details, 36-week curriculum content, or issuing certificates. What would you like to review today?`;
        initialSuggestions = ["Curriculum Breakdown", "Class Progress Summary", "How to issue Certificates"];
      }
      
      setChatHistory(prev => {
        if (prev.length <= 1) {
          return [{ role: 'ai', text: welcomeMsg, suggestions: initialSuggestions }];
        }
        return prev;
      });
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSend = async (e, directText) => {
    if (e) e.preventDefault();
    const textToSend = directText || message;
    if (!textToSend.trim()) return;

    if (!directText) {
      setMessage('');
    }
    setChatHistory(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'ai', ...data }]);
      } else {
        const errorData = await res.json();
        setChatHistory(prev => [...prev, { 
            role: 'ai', 
            text: `Server Error: ${errorData.error || 'Failed to fetch AI response'}` 
        }]);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: `Network Error: ${err.message}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
          >
            <Bot className="w-8 h-8 group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background"></div>
          </motion.button>
        )}
      </AnimatePresence>
 
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className={`${
              isExpanded ? 'fixed inset-6' : 'w-[420px] h-[640px]'
            } glass-card rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden backdrop-blur-3xl`}
          >
            {/* Header */}
            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-secondary w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">21stc AI Mentor</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Active Learning Mode</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] space-y-3`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.role === 'ai' ? <Bot className="w-4 h-4 text-secondary" /> : <User className="w-4 h-4 text-zinc-500" />}
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {msg.role === 'ai' ? 'AI Mentor' : user?.name || 'You'}
                      </span>
                    </div>
                    
                    <div className={`p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-secondary/10 border border-secondary/20 text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-zinc-200 rounded-tl-none'
                    } text-sm leading-relaxed`}>
                      {msg.role === 'ai' ? <RenderMarkdown text={msg.text} /> : msg.text}
                    </div>

                    {/* Rich Content (Inspired by User Image) */}
                    {msg.richContent && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4 shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">{msg.richContent.title}</h4>
                          {msg.richContent.type === 'module_overview' && <BookOpen className="w-4 h-4 text-primary" />}
                          {msg.richContent.type === 'insight' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                        </div>

                        {msg.richContent.type === 'module_overview' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase">
                              <span>Completion Progress</span>
                              <span className="text-primary">{msg.richContent.completion}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${msg.richContent.completion}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-2">
                              {(msg.richContent.concepts || []).map((c, ci) => (
                                <div key={ci} className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium bg-white/5 p-2 rounded-lg">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  {c}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {msg.richContent.type === 'insight' && (
                          <p className="text-[11px] text-zinc-400 leading-relaxed italic border-l-2 border-emerald-500 pl-3 py-1">
                            {msg.richContent.content}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Suggestions */}
                    {msg.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.suggestions.map((s, si) => (
                          <button 
                            key={si}
                            onClick={() => handleSend(null, s)}
                            className="text-[10px] font-bold text-secondary bg-secondary/5 border border-secondary/20 px-3 py-1.5 rounded-full hover:bg-secondary/10 transition-colors flex items-center gap-1"
                          >
                            {s}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/5 border-t border-white/5">
              <form onSubmit={handleSend} className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask me anything about your studies..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl pl-5 pr-32 py-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all resize-none h-[60px]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => {
                    addNotification({ title: 'Image Upload', body: 'Image vision features are coming soon.', type: 'info' });
                  }} className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => {
                    addNotification({ title: 'Voice Input', body: 'Voice transcription will be available in v3.0.', type: 'info' });
                  }} className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!message.trim() || isTyping}
                    className="p-2.5 bg-secondary text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <div className="mt-3 flex justify-center gap-6">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Powered by 21stc Neural Engine</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatWidget;
