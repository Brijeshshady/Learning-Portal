import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, Save, ArrowRight, ArrowLeft, Send, Sparkles } from 'lucide-react';
import DB from '../lib/db';

const ExamAttempt = ({ user }) => {
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: answerText }
  const [flagged, setFlagged] = useState({}); // { questionId: boolean } for review later
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [isFullscreenLocked, setIsFullscreenLocked] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const autoSaveTimerRef = useRef(null);
  const examId = new URLSearchParams(window.location.search).get('examId');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const tabSwitchesRef = useRef(tabSwitches);
  tabSwitchesRef.current = tabSwitches;

  const fullscreenExitsRef = useRef(fullscreenExits);
  fullscreenExitsRef.current = fullscreenExits;

  useEffect(() => {
    const loadAttemptData = async () => {
      try {
        const examDetails = await DB.getExamById(examId);
        setExam(examDetails);
        
        const data = await DB.getExamAttempt(examId);
        if (data && data.attempt) {
          setAttempt(data.attempt);
          setQuestions(data.questions || []);
          setTabSwitches(data.attempt.securityFlags?.tabSwitches || 0);
          setFullscreenExits(data.attempt.securityFlags?.fullscreenExits || 0);
          setIsFullscreenLocked(!document.fullscreenElement);
          
          // Map existing answers
          const answerMap = {};
          data.attempt.answers.forEach(ans => {
            answerMap[ans.questionId] = ans.answer || '';
          });
          setAnswers(answerMap);
          
          // Calculate timer bounds
          const start = new Date(data.attempt.startedAt).getTime();
          const durationMs = examDetails.duration * 60 * 1000;
          const end = start + durationMs;
          const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      } catch (err) {
        console.error("Failed to load attempt:", err);
      } finally {
        setLoading(false);
      }
    };
    if (examId) loadAttemptData();
  }, [examId]);

  // Countdown timer
  useEffect(() => {
    if (loading || timeLeft <= 0 || submitting) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loading, timeLeft, submitting]);

  // Proctoring: detect tab changes & fullscreen exits
  useEffect(() => {
    if (loading || submitting) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const updated = prev + 1;
          setShowWarningModal(true);
          // Auto save immediately on tab switch to log violation
          saveProgress(answersRef.current, updated, fullscreenExitsRef.current);
          return updated;
        });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenLocked(true);
        setFullscreenExits(prev => {
          const updated = prev + 1;
          setShowWarningModal(true);
          // Auto save immediately on fullscreen exit to log violation
          saveProgress(answersRef.current, tabSwitchesRef.current, updated);
          return updated;
        });
      } else {
        setIsFullscreenLocked(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [loading, submitting]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (loading || submitting) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      saveProgress(answersRef.current, tabSwitchesRef.current, fullscreenExitsRef.current);
    }, 10000);
    
    return () => clearInterval(autoSaveTimerRef.current);
  }, [loading, submitting]);

  const saveProgress = async (currentAnswers, currentFlags, currentExits) => {
    if (!attempt) return;
    setSaving(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: currentAnswers[q.id] || ''
      }));
      await DB.saveExamProgress(attempt.id, formattedAnswers, {
        tabSwitches: currentFlags,
        fullscreenExits: currentExits
      });
    } catch (err) {
      console.warn("Auto save failed temporarily:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectOption = (qId, optionVal) => {
    const updated = { ...answers, [qId]: optionVal };
    setAnswers(updated);
  };

  const handleTextChange = (qId, val) => {
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const handleSubmitExam = async () => {
    if (submitting) return;
    const confirmSubmit = window.confirm("Are you sure you want to submit your exam now?");
    if (!confirmSubmit) return;
    
    await executeSubmission();
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    console.log("Time expired, auto-submitting...");
    await executeSubmission();
  };

  const executeSubmission = async () => {
    setSubmitting(true);
    clearInterval(autoSaveTimerRef.current);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }));
      await DB.submitExam(attempt.id, formattedAnswers);
      
      // Navigate to results
      const params = new URLSearchParams(window.location.search);
      params.set('v', 'exam-results');
      params.set('examId', examId);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      alert("Failed to submit exam: " + err.message);
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exams');
    params.delete('examId');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleEnterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setIsFullscreenLocked(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam || !attempt) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <p className="text-white font-bold">Exam attempt session could not be established.</p>
        <button onClick={handleBackToDashboard} className="mt-4 bg-primary px-6 py-2 rounded-xl text-white font-semibold">
          Back to Exams
        </button>
      </div>
    );
  }

  const activeQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative select-none">
      
      {/* Header bar */}
      <header className="bg-zinc-900/60 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-white font-black text-base line-clamp-1">{exam.title}</h2>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{exam.subject}</span>
            <span className="text-[10px] text-zinc-500 font-bold">•</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Passing: {exam.passingMarks}/{exam.totalMarks} Marks</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-bounce text-secondary' : ''}`} />
            <span>{saving ? 'Auto-saving...' : 'Progress Saved'}</span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-800 rounded-2xl px-4 py-2 text-white font-black">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-secondary'}`} />
            <span className={timeLeft < 180 ? 'text-red-400 animate-pulse' : 'text-white'}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Pane: Question content */}
        <main className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-zinc-500 font-black text-xs uppercase tracking-widest">
                Question {currentIndex + 1} of {questions.length}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-lg">
                {activeQuestion?.marks} Marks
              </span>
            </div>

            {/* Question Text */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl mb-8">
              <p className="text-white text-base leading-relaxed whitespace-pre-line font-bold">
                {activeQuestion?.question}
              </p>
            </div>

            {/* Answer Input Render based on Type */}
            <div className="space-y-4">
              {activeQuestion?.type === 'mcq' && (
                <div className="grid grid-cols-1 gap-3">
                  {activeQuestion.options?.map((option, idx) => {
                    const isSelected = answers[activeQuestion.id] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(activeQuestion.id, option)}
                        className={`text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-secondary/15 border-secondary text-white'
                            : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700/80 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-semibold">{option}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-secondary bg-secondary' : 'border-zinc-700'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeQuestion?.type === 'descriptive' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Write your response</label>
                  <textarea
                    value={answers[activeQuestion.id] || ''}
                    onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl px-6 py-5 text-sm text-white focus:outline-none focus:border-secondary/60 h-80 resize-none leading-relaxed"
                    placeholder="Enter your detailed answer here..."
                  />
                </div>
              )}

              {activeQuestion?.type === 'coding' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Python Workspace</label>
                    <span className="text-[9px] font-black text-secondary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Sandbox Mode
                    </span>
                  </div>
                  
                  {/* Code editor block */}
                  <textarea
                    value={answers[activeQuestion.id] || activeQuestion.codingDetails?.starterCode || ''}
                    onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                    className="w-full font-mono bg-zinc-950 border border-zinc-800 rounded-3xl px-6 py-5 text-sm text-emerald-400 focus:outline-none focus:border-secondary/60 h-96 resize-none leading-relaxed"
                    placeholder="# Write python code here"
                    style={{ tabSize: 4 }}
                  />

                  {/* Public testcases list */}
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Sample Test Cases</p>
                    <div className="space-y-2">
                      {activeQuestion.codingDetails?.testCases?.map((tc, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-zinc-800 py-2 last:border-b-0">
                          <div>
                            <span className="text-zinc-500 font-bold">Input:</span> <code className="text-zinc-300 ml-1">{tc.input}</code>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-bold">Expected:</span> <code className="text-emerald-400 ml-1">{tc.expectedOutput}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="max-w-3xl mx-auto w-full mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                currentIndex === 0
                  ? 'text-zinc-700 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <button
              onClick={() => {
                const updated = { ...flagged, [activeQuestion.id]: !flagged[activeQuestion.id] };
                setFlagged(updated);
              }}
              className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                flagged[activeQuestion.id]
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'border-zinc-800 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {flagged[activeQuestion.id] ? 'Flagged for review' : 'Flag for review'}
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Submit Exam
                <Send className="w-3.5 h-3.5 fill-white" />
              </button>
            )}
          </div>
        </main>

        {/* Right Side Pane: Questions grid map */}
        <aside className="w-80 border-l border-zinc-900 bg-zinc-900/20 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Question Map</h4>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const hasAnswer = !!answers[q.id];
                const isFlagged = flagged[q.id];
                const isCurrent = idx === currentIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center relative border ${
                      isCurrent
                        ? 'bg-secondary border-secondary text-white shadow-md shadow-secondary/20'
                        : isFlagged
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : hasAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 mt-8">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tab switches</p>
                  <p className="text-sm font-black text-red-400">{tabSwitches} / 3 Allowed</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fullscreen Exits</p>
                  <p className="text-sm font-black text-amber-400">{fullscreenExits} Detected</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Proctoring warnings Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWarningModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-md w-full relative z-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white">Security Alert!</h3>
              <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                Tab switching or window unfocusing is strictly monitored. This action has been logged in the system.
              </p>
              <div className="bg-zinc-800 border border-zinc-800 rounded-2xl p-4 mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tab switches</p>
                  <p className="text-base font-black text-white mt-1">{tabSwitches}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fullscreen Exits</p>
                  <p className="text-base font-black text-white mt-1">{fullscreenExits}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWarningModal(false)}
                className="mt-8 w-full bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
              >
                Return to Exam
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Security Lock Overlay */}
      <AnimatePresence>
        {isFullscreenLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="absolute top-12 left-1/4 w-80 h-80 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-12 right-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[3rem] p-10 max-w-lg w-full backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 blur-3xl rounded-full -mr-24 -mt-24"></div>

              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-3xl animate-ping opacity-75 duration-1000"></div>
                <ShieldAlert className="w-10 h-10 text-red-500 relative z-10" />
              </div>

              <h2 className="text-2xl font-black text-white">Exam Security Lock</h2>
              <p className="text-zinc-400 text-sm mt-4 leading-relaxed font-semibold">
                To maintain assessment integrity and prevent external distractions, this examination requires active **Fullscreen Mode**.
              </p>
              
              <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 mt-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <p className="text-zinc-400 text-xs font-bold">Leaving fullscreen is logged as a proctor violation.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <p className="text-zinc-400 text-xs font-bold">Clipboard copying and right-click actions are disabled.</p>
                </div>
              </div>

              <button
                onClick={handleEnterFullscreen}
                className="mt-8 w-full bg-secondary hover:bg-secondary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
              >
                Enable Fullscreen & Begin
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamAttempt;
