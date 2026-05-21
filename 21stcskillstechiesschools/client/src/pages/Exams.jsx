import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, HelpCircle, Calendar, Play, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import DB from '../lib/db';

const Exams = ({ user, setView }) => {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsList, resultsList] = await Promise.all([
          DB.getExams(),
          DB.getStudentResults()
        ]);
        setExams(examsList);
        setResults(resultsList);
      } catch (err) {
        console.error("Error loading exams page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatus = (exam) => {
    const result = results.find(r => r.examId === exam.id);
    if (result) return 'completed';
    
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  const handleStartExam = async (examId) => {
    try {
      const attempt = await DB.startExamAttempt(examId);
      // Navigate to exam-attempt page by passing v=exam-attempt&examId=xxx
      const params = new URLSearchParams(window.location.search);
      params.set('v', 'exam-attempt');
      params.set('examId', examId);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      // Force state reload or let dashboard re-render by updating state
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      alert("Failed to start exam: " + err.message);
    }
  };

  const handleViewResult = (examId) => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exam-results');
    params.set('examId', examId);
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ClipboardList className="text-secondary w-7 h-7" />
            Skillstech Assessments
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Access scheduled, active, and past evaluations here.</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center max-w-xl mx-auto mt-10 backdrop-blur-xl">
          <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-white font-black text-lg">No Exams Scheduled</h3>
          <p className="text-zinc-500 text-sm mt-2">There are currently no examinations scheduled for Grade {user?.grade || 7}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = getStatus(exam);
            const result = results.find(r => r.examId === exam.id);
            const startTimeStr = new Date(exam.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
            
            return (
              <motion.div
                key={exam.id}
                whileHover={{ y: -4 }}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] overflow-hidden backdrop-blur-xl flex flex-col justify-between p-6 relative group"
              >
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-all duration-500"></div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/50">
                      {exam.subject}
                    </span>
                    {status === 'completed' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                        Completed
                      </span>
                    )}
                    {status === 'active' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1.5 rounded-xl animate-pulse">
                        Active Now
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                        Upcoming
                      </span>
                    )}
                    {status === 'ended' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                        Closed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-secondary transition-colors line-clamp-1">{exam.title}</h3>
                  <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">{exam.description || 'No description provided.'}</p>

                  <div className="space-y-2 mt-6 pt-4 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration: {exam.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Marks: {exam.totalMarks} (Passing: {exam.passingMarks})</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Starts: {startTimeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  {status === 'completed' && (
                    <button
                      onClick={() => handleViewResult(exam.id)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-zinc-700/60 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      View Performance
                    </button>
                  )}
                  {status === 'active' && (
                    <button
                      onClick={() => handleStartExam(exam.id)}
                      className="w-full bg-secondary hover:bg-secondary/90 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Assessment
                    </button>
                  )}
                  {status === 'upcoming' && (
                    <button
                      disabled
                      className="w-full bg-zinc-900/40 text-zinc-600 border border-zinc-800/80 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Locked (Upcoming)
                    </button>
                  )}
                  {status === 'ended' && !result && (
                    <button
                      disabled
                      className="w-full bg-zinc-900/40 text-zinc-600 border border-zinc-800/80 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      Missed Exam
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Exams;
