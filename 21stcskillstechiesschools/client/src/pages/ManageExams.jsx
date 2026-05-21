import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Clock, FileText, ChevronRight, User, Trash, Radio, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import DB from '../lib/db';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await DB.getExams();
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = async (exam) => {
    if (selectedExam?.id === exam.id) {
      setSelectedExam(null);
      setAttempts([]);
      return;
    }
    
    setSelectedExam(exam);
    setAttemptsLoading(true);
    try {
      const attemptData = await DB.getExamAttempts(exam.id);
      setAttempts(attemptData);
    } catch (err) {
      console.error("Failed to load attempts:", err);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handlePublish = async (e, examId) => {
    e.stopPropagation();
    if (!window.confirm("Publish this exam? This will make it visible to students at start time.")) return;
    try {
      await DB.publishExam(examId);
      loadExams();
      if (selectedExam?.id === examId) {
        setSelectedExam(prev => ({ ...prev, status: 'published' }));
      }
    } catch (err) {
      alert("Failed to publish: " + err.message);
    }
  };

  const handleDelete = async (e, examId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this exam and all its questions? This cannot be undone.")) return;
    try {
      await DB.deleteExam(examId);
      setSelectedExam(null);
      loadExams();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleGoToCreate = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'create-exam');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleGradeAttempt = (attemptId) => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'evaluate-answers');
    params.set('attemptId', attemptId);
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ClipboardList className="text-secondary w-7 h-7" />
            Manage Assessments
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Configure scheduled exams, review student attempts, and execute grading.</p>
        </div>
        
        <button
          onClick={handleGoToCreate}
          className="bg-primary hover:bg-blue-600 text-white font-black px-5 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Exams List column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Active Assessments</h3>
          
          {exams.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-semibold">No assessments found. Create one to get started.</p>
            </div>
          ) : (
            exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              const dateStr = new Date(exam.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
              
              return (
                <div
                  key={exam.id}
                  onClick={() => handleSelectExam(exam)}
                  className={`bg-zinc-900/60 border rounded-[2rem] p-6 backdrop-blur-xl transition-all cursor-pointer relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected 
                      ? 'border-secondary bg-zinc-900' 
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                        Grade {exam.gradeId}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg">
                        {exam.subject}
                      </span>
                      
                      {exam.status === 'draft' ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          Draft
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          Published
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-secondary transition-colors truncate">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-zinc-500 text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{exam.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{exam.questions?.length || 0} Questions</span>
                      </div>
                      <div>
                        <span>Starts: {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {exam.status === 'draft' && (
                      <button
                        onClick={(e) => handlePublish(e, exam.id)}
                        className="bg-secondary/15 hover:bg-secondary/25 border border-secondary/20 text-secondary font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest transition-all"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, exam.id)}
                      title="Delete assessment"
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2.5 rounded-xl transition-all"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    <ChevronRight className={`w-5 h-5 text-zinc-600 transition-transform ${isSelected ? 'rotate-90 text-white' : ''}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Exam Attempts column */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 backdrop-blur-xl flex flex-col justify-between min-h-[450px]">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">
              Roster Submissions
            </h3>
            
            {!selectedExam ? (
              <div className="text-center py-20">
                <User className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
                  Select an assessment from the list to view student attempts and execute evaluation.
                </p>
              </div>
            ) : attemptsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-20">
                <User className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-xs font-semibold">No student attempts logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Exam</p>
                  <p className="text-xs font-black text-white mt-1">{selectedExam.title}</p>
                </div>

                <div className="space-y-3">
                  {attempts.map((att) => (
                    <div
                      key={att.id}
                      className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-800 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{att.studentName}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{att.studentEmail}</p>
                        </div>
                        
                        {att.status === 'in-progress' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md animate-pulse">
                            Progressing
                          </span>
                        )}
                        {att.status === 'submitted' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            Submitted
                          </span>
                        )}
                        {att.status === 'evaluated' && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Graded: {att.marksObtained}/{att.totalMarks}
                          </span>
                        )}
                      </div>

                      {att.securityFlags?.tabSwitches > 0 && (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">
                            {att.securityFlags.tabSwitches} window switches flagged
                          </span>
                        </div>
                      )}

                      {(att.status === 'submitted' || att.status === 'evaluated') && (
                        <button
                          onClick={() => handleGradeAttempt(att.id)}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-secondary" />
                          Grade / Details
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageExams;
