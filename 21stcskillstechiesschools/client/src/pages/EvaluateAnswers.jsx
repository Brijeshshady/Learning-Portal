import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Sparkles, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import DB from '../lib/db';

const EvaluateAnswers = () => {
  const [data, setData] = useState(null);
  const [gradedAnswers, setGradedAnswers] = useState({}); // { questionId: { score, feedback } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const attemptId = new URLSearchParams(window.location.search).get('attemptId');

  useEffect(() => {
    const loadAttemptData = async () => {
      try {
        const res = await DB.getAttemptEvaluation(attemptId);
        setData(res);
        
        // Populate initial overrides state from the evaluated session
        const overrides = {};
        res.attempt.answers.forEach(ans => {
          overrides[ans.questionId] = {
            score: ans.score || 0,
            feedback: ans.feedback || ''
          };
        });
        setGradedAnswers(overrides);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (attemptId) loadAttemptData();
  }, [attemptId]);

  const handleScoreChange = (qId, scoreVal, maxMarks) => {
    const score = Math.max(0, Math.min(maxMarks, Number(scoreVal)));
    setGradedAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], score }
    }));
  };

  const handleFeedbackChange = (qId, feedbackVal) => {
    setGradedAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], feedback: feedbackVal }
    }));
  };

  const handleBackToManage = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exams');
    params.delete('attemptId');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSaveEvaluation = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const payload = Object.keys(gradedAnswers).map(qId => ({
        questionId: qId,
        score: gradedAnswers[qId].score,
        feedback: gradedAnswers[qId].feedback
      }));
      
      await DB.saveManualEvaluation(attemptId, payload);
      setSuccess(true);
      setTimeout(() => {
        handleBackToManage();
      }, 1500);
    } catch (err) {
      alert("Failed to save evaluation overrides: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <p className="text-white font-bold">Attempt record not found.</p>
        <button onClick={handleBackToManage} className="mt-4 bg-primary px-6 py-2 rounded-xl text-white font-semibold">
          Back
        </button>
      </div>
    );
  }

  const { attempt, exam, questions, student, result } = data;
  const questionsMap = new Map(questions.map(q => [q.id, q]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={handleBackToManage}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Manage Exams
      </button>

      {/* Roster & details card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl rounded-full -mr-24 -mt-24"></div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 px-3.5 py-1.5 rounded-xl border border-zinc-700/50">
            Grading Workspace
          </span>
          <h2 className="text-2xl font-black text-white mt-4">{student?.name}'s Submission</h2>
          <p className="text-zinc-400 text-sm mt-1">{exam?.title}</p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {attempt.securityFlags?.tabSwitches > 0 || attempt.securityFlags?.fullscreenExits > 0 ? (
              <>
                {attempt.securityFlags?.tabSwitches > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                      {attempt.securityFlags.tabSwitches} window switches detected
                    </span>
                  </div>
                )}
                {attempt.securityFlags?.fullscreenExits > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {attempt.securityFlags.fullscreenExits} fullscreen exits detected
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Clean Proctor Log (No violations)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative z-10 shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Status</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-lg">
              {attempt.status}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-zinc-800"></div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Current Marks</p>
            <p className="text-xl font-black text-white">
              {attempt.score} <span className="text-zinc-500 text-xs">/ {exam.totalMarks}</span>
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold mb-6">
          <Save className="w-5 h-5 shrink-0 animate-bounce" />
          <span>Evaluation overrides synced successfully! Saving result report...</span>
        </div>
      )}

      {/* Itemized grading workspace */}
      <div className="space-y-8">
        {attempt.answers.map((ans, idx) => {
          const q = questionsMap.get(ans.questionId);
          if (!q) return null;
          
          const grades = gradedAnswers[q.id] || { score: 0, feedback: '' };

          return (
            <div key={q.id} className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-500 font-black text-xs uppercase tracking-widest">Question {idx + 1}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/50">
                  {q.type.toUpperCase()} • Max: {q.marks} Marks
                </span>
              </div>

              <p className="text-white text-base font-bold leading-relaxed">{q.question}</p>

              {/* Student's answer preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Student's Submission</p>
                  {q.type === 'coding' ? (
                    <pre className="font-mono text-emerald-400 whitespace-pre-wrap text-xs">{ans.answer || '[No code response]'}</pre>
                  ) : (
                    <p className="text-zinc-300 text-xs leading-relaxed font-semibold">{ans.answer || '[No response]'}</p>
                  )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Ideal Solution / Grading Criteria</p>
                  {q.type === 'coding' ? (
                    <pre className="font-mono text-zinc-400 whitespace-pre-wrap text-xs">{q.correctAnswer}</pre>
                  ) : (
                    <p className="text-zinc-400 text-xs leading-relaxed font-semibold">{q.correctAnswer}</p>
                  )}
                </div>
              </div>

              {/* AI Assistant recommendations */}
              {ans.feedback && (
                <div className="bg-secondary/5 border border-secondary/10 p-4 rounded-2xl mt-6 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                    <span className="text-white font-bold">AI Suggestion:</span> {ans.feedback}
                  </p>
                </div>
              )}

              {/* Grading input panel */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t border-zinc-800/60">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Award Marks</label>
                  <input
                    type="number"
                    min="0"
                    max={q.marks}
                    value={grades.score}
                    onChange={e => handleScoreChange(q.id, e.target.value, q.marks)}
                    className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60 text-center font-bold"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Feedback Comments</label>
                  <input
                    type="text"
                    value={grades.feedback}
                    onChange={e => handleFeedbackChange(q.id, e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-secondary/60"
                    placeholder="Provide manual grading feedback or adjust AI recommendations..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSaveEvaluation}
        disabled={saving}
        className="w-full bg-primary hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all mt-8 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving Evaluation...' : 'Save and Finalize Evaluation'}
      </button>
    </div>
  );
};

export default EvaluateAnswers;
