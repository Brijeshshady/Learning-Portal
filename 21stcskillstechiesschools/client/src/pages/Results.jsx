import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Target, CheckCircle2, XCircle, ChevronLeft, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import DB from '../lib/db';

const Results = () => {
  const [resultsList, setResultsList] = useState([]);
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = new URLSearchParams(window.location.search);
  const examId = searchParams.get('examId');

  useEffect(() => {
    const loadResults = async () => {
      try {
        if (examId) {
          const detail = await DB.getStudentResultByExam(examId);
          setActiveResult(detail);
        } else {
          const list = await DB.getStudentResults();
          setResultsList(list);
        }
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [examId]);

  const handleBackToExams = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exams');
    params.delete('examId');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleViewDetails = (eId) => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exam-results');
    params.set('examId', eId);
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

  // Render detail view if a specific result is chosen
  if (activeResult) {
    const { result, exam, attempt, questions } = activeResult;
    
    // Format topicWiseAnalysis for Recharts
    const topicData = result.topicWiseAnalysis && result.topicWiseAnalysis.length > 0 
      ? result.topicWiseAnalysis.map(t => ({
          subject: t.topic,
          score: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0
        }))
      : [];

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button
          onClick={handleBackToExams}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessments
        </button>

        {/* Hero Scorecard */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl rounded-full -mr-24 -mt-24"></div>
          
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800 px-3.5 py-1.5 rounded-xl border border-zinc-700/50">
              Scorecard
            </span>
            <h2 className="text-2xl font-black text-white mt-4">{exam?.title || 'Exam Performance'}</h2>
            <p className="text-zinc-400 text-sm mt-1">{exam?.subject} Assessment Report</p>
            
            {(attempt?.securityFlags?.tabSwitches > 0 || attempt?.securityFlags?.fullscreenExits > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {attempt.securityFlags.tabSwitches > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl w-fit">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                      {attempt.securityFlags.tabSwitches} window switches
                    </span>
                  </div>
                )}
                {attempt.securityFlags.fullscreenExits > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl w-fit">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {attempt.securityFlags.fullscreenExits} fullscreen exits
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative z-10 shrink-0">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Percentage</p>
              <p className="text-4xl font-black text-secondary">{result.percentage}%</p>
            </div>
            <div className="w-[1px] h-12 bg-zinc-800"></div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Score</p>
              <p className="text-xl font-black text-white">
                {result.marksObtained} <span className="text-zinc-500 text-xs">/ {result.totalMarks}</span>
              </p>
            </div>
          </div>
        </div>

        {/* AI Weak Area / Strength Analysis & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* AI Insights Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-secondary">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Diagnosis</h3>
              </div>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-semibold">
                {result.remarks || "No remarks generated yet."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800/60">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {result.strengths?.map((str, idx) => (
                    <li key={idx} className="text-zinc-300 text-xs font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-xl w-fit">
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Weak Areas
                </p>
                <ul className="space-y-1.5">
                  {result.weakAreas?.map((weak, idx) => (
                    <li key={idx} className="text-zinc-300 text-xs font-semibold bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-xl w-fit">
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Topic Performance Chart */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl flex flex-col items-center justify-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6 w-full text-left">Subject Mastery</h3>
            {topicData.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topicData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a' }} />
                    <Radar name="Mastery" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-zinc-500 text-xs font-semibold">Insufficient data to plot mastery chart.</p>
            )}
          </div>
        </div>

        {/* Itemized Question & Answer Review */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6">Question-by-Question Review</h3>
          
          <div className="space-y-6 divide-y divide-zinc-800/80">
            {questions.map((q, idx) => {
              const studentAns = attempt?.answers?.find(a => a.questionId === q.id);
              const isCorrect = studentAns?.isCorrect;
              
              return (
                <div key={q.id} className="pt-6 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-black text-xs uppercase tracking-widest">Question {idx + 1}</span>
                        <span className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] text-zinc-500 font-bold">
                          {studentAns?.score} / {q.marks} Marks
                        </span>
                      </div>
                      
                      <p className="text-white text-sm font-semibold mt-2 leading-relaxed">{q.question}</p>
                      
                      {/* Render Answer Box based on Question type */}
                      <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 mt-4 text-xs">
                        <p className="text-zinc-500 font-black uppercase tracking-widest mb-1.5">Your Submission</p>
                        {q.type === 'coding' ? (
                          <pre className="font-mono text-emerald-400 whitespace-pre-wrap">{studentAns?.answer || '[No Code Submitted]'}</pre>
                        ) : (
                          <p className="text-zinc-300 font-bold">{studentAns?.answer || '[Empty response]'}</p>
                        )}
                      </div>

                      {/* Correct Answers & Rubric Explanations */}
                      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 mt-3 text-xs">
                        <p className="text-zinc-500 font-black uppercase tracking-widest mb-1.5">Ideal Solution / Grading Criteria</p>
                        {q.type === 'coding' ? (
                          <pre className="font-mono text-zinc-400 whitespace-pre-wrap">{q.correctAnswer}</pre>
                        ) : (
                          <p className="text-zinc-400 font-bold">{q.correctAnswer}</p>
                        )}
                      </div>

                      {/* Teacher/AI Feedback */}
                      {studentAns?.feedback && (
                        <div className="mt-3 flex items-start gap-2 bg-secondary/5 border border-secondary/10 p-3 rounded-2xl">
                          <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                            <span className="text-white font-bold">AI Evaluator:</span> {studentAns.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render list view if no examId is chosen
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
        <Award className="text-secondary w-7 h-7" />
        Exam Performance Records
      </h1>

      {resultsList.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-white font-black text-base">No evaluations released yet.</h3>
          <p className="text-zinc-500 text-xs mt-2">When evaluations are completed, your scorecards will appear here.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="p-5">Exam</th>
                  <th className="p-5">Subject</th>
                  <th className="p-5">Score</th>
                  <th className="p-5">Percentage</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {resultsList.map((res) => (
                  <tr key={res.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="p-5 text-sm font-bold text-white">{res.examTitle}</td>
                    <td className="p-5 text-xs text-zinc-400 font-semibold">{res.examSubject}</td>
                    <td className="p-5 text-sm text-zinc-300 font-bold">{res.marksObtained} / {res.totalMarks}</td>
                    <td className="p-5 text-sm font-black text-secondary">{res.percentage}%</td>
                    <td className="p-5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        Evaluated
                      </span>
                    </td>
                    <td className="p-5">
                      <button
                        onClick={() => handleViewDetails(res.examId)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest border border-zinc-700/60 transition-all"
                      >
                        Scorecard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
