import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Trash, Sparkles, AlertCircle, Save, HelpCircle } from 'lucide-react';
import DB from '../lib/db';

const CreateExam = () => {
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    gradeId: 7,
    subject: 'Python',
    type: 'mixed',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    startTime: '',
    endTime: '',
    instructions: ''
  });

  const [questions, setQuestions] = useState([]);
  const [aiParams, setAiParams] = useState({
    topic: '',
    difficulty: 'medium',
    type: 'mcq',
    count: 5
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Manual Question Adding
  const handleAddManualQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        type: 'mcq',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 10,
        difficulty: 'medium',
        explanation: '',
        codingDetails: {
          starterCode: '',
          testCases: [{ input: '', expectedOutput: '', isPublic: true }]
        }
      }
    ]);
  };

  const handleUpdateQuestion = (index, field, val) => {
    const updated = [...questions];
    updated[index][field] = val;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // AI Question Generation
  const handleGenerateAIQuestions = async () => {
    if (!aiParams.topic) {
      alert("Please specify a topic for AI Generation.");
      return;
    }
    setAiGenerating(true);
    setError(null);
    try {
      const generated = await DB.aiGenerateQuestions({
        grade: examData.gradeId,
        subject: examData.subject,
        topic: aiParams.topic,
        difficulty: aiParams.difficulty,
        type: aiParams.type,
        count: aiParams.count
      });
      
      const parsedGenerated = generated.map(q => ({
        question: q.question,
        type: aiParams.type,
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctAnswer || '',
        marks: Number(examData.totalMarks / aiParams.count) || 10,
        difficulty: q.difficulty || aiParams.difficulty,
        explanation: q.explanation || '',
        codingDetails: q.codingDetails || {
          starterCode: '',
          testCases: [{ input: '', expectedOutput: '', isPublic: true }]
        }
      }));

      setQuestions([...questions, ...parsedGenerated]);
    } catch (err) {
      setError("AI Generation failed. Falling back to manual question inputs.");
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (questions.length === 0) {
      setError("Please add at least one question to the exam.");
      return;
    }

    try {
      // 1. Create the base exam configuration
      const createdExam = await DB.createExam(examData);
      
      // 2. Add the questions list
      await DB.addQuestions(createdExam.id, questions);

      setSuccess(true);
      setTimeout(() => {
        // Navigate back to manage-exams v=exams
        const params = new URLSearchParams(window.location.search);
        params.set('v', 'exams');
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create assessment.");
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('v', 'exams');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ClipboardList className="text-secondary w-7 h-7" />
            Create Academic Assessment
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Setup schedule settings, total marks, and questions mapping.</p>
        </div>
        <button
          onClick={handleBack}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest border border-zinc-700/60 transition-all"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold mb-6">
          <Save className="w-5 h-5 shrink-0 animate-bounce" />
          <span>Exam assessment saved and published successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSaveExam} className="space-y-8">
        {/* Core details card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Exam Parameter Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Assessment Title</label>
              <input required type="text" value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" placeholder="e.g. Term 1 Python Programming Quiz" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Subject</label>
              <select value={examData.subject} onChange={e => setExamData({...examData, subject: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60">
                <option value="Python">Python Development</option>
                <option value="Robotics">Robotics & Arduino</option>
                <option value="IoT">Internet of Things</option>
                <option value="AI-Lab">Machine Learning & Neural Nets</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Target Grade</label>
              <input required type="number" min="1" max="12" value={examData.gradeId} onChange={e => setExamData({...examData, gradeId: Number(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Duration (minutes)</label>
              <input required type="number" min="5" value={examData.duration} onChange={e => setExamData({...examData, duration: Number(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Total Marks</label>
              <input required type="number" min="1" value={examData.totalMarks} onChange={e => setExamData({...examData, totalMarks: Number(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Passing Marks</label>
              <input required type="number" min="1" value={examData.passingMarks} onChange={e => setExamData({...examData, passingMarks: Number(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Availability Start Date/Time</label>
              <input required type="datetime-local" value={examData.startTime} onChange={e => setExamData({...examData, startTime: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Availability End Date/Time</label>
              <input required type="datetime-local" value={examData.endTime} onChange={e => setExamData({...examData, endTime: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Instructions</label>
            <textarea value={examData.instructions} onChange={e => setExamData({...examData, instructions: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60 h-24 resize-none" placeholder="Provide general exam instructions for students..." />
          </div>
        </div>

        {/* AI Question Builder pill */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 blur-3xl rounded-full"></div>
          
          <div className="flex items-center gap-2 text-secondary mb-6">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Question Builder Tool</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Topic</label>
              <input type="text" value={aiParams.topic} onChange={e => setAiParams({...aiParams, topic: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60" placeholder="e.g. Loops or Resistors" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Question Type</label>
              <select value={aiParams.type} onChange={e => setAiParams({...aiParams, type: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60">
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="coding">Coding (Python Sandbox)</option>
                <option value="descriptive">Descriptive (AI Evaluation)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Difficulty</label>
              <select value={aiParams.difficulty} onChange={e => setAiParams({...aiParams, difficulty: e.target.value})} className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/60">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleGenerateAIQuestions}
                className="w-full bg-secondary hover:bg-secondary/90 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Exam Questions ({questions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddManualQuestion}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-secondary" /> Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-3xl p-12 text-center">
              <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-semibold">No questions added yet. Use the AI builder or add one manually.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-6 h-6 rounded-lg bg-secondary/15 border border-secondary/20 text-secondary font-black text-xs flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={e => handleUpdateQuestion(qIdx, 'type', e.target.value)}
                      className="bg-zinc-800 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="coding">Coding</option>
                      <option value="descriptive">Descriptive</option>
                    </select>
                    
                    <input
                      type="number"
                      value={q.marks}
                      onChange={e => handleUpdateQuestion(qIdx, 'marks', Number(e.target.value))}
                      className="w-16 bg-zinc-800 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center"
                      placeholder="Marks"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Question Prompt</label>
                      <input
                        required
                        type="text"
                        value={q.question}
                        onChange={e => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-secondary/60"
                        placeholder="Enter the question query..."
                      />
                    </div>

                    {q.type === 'mcq' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Option {String.fromCharCode(65 + optIdx)}</label>
                            <input
                              required
                              type="text"
                              value={opt}
                              onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-secondary/60"
                            />
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Correct Option Answer</label>
                          <select
                            value={q.correctAnswer}
                            onChange={e => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-secondary/60"
                          >
                            <option value="">Select Correct Option</option>
                            {q.options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt || `Option ${String.fromCharCode(65 + oIdx)}`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {q.type === 'descriptive' && (
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Grading Rubric / Ideal Answer Guidelines</label>
                        <textarea
                          required
                          value={q.correctAnswer}
                          onChange={e => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-secondary/60 h-20 resize-none"
                          placeholder="Provide grading instructions for teachers or details the student's answer must include..."
                        />
                      </div>
                    )}

                    {q.type === 'coding' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Starter Boilerplate Code</label>
                          <textarea
                            value={q.codingDetails?.starterCode || ''}
                            onChange={e => {
                              const updated = [...questions];
                              updated[qIdx].codingDetails.starterCode = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full font-mono bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-secondary/60 h-24 resize-none"
                            placeholder="e.g. def solve():\n    pass"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Correct Answer Python Solution</label>
                          <textarea
                            value={q.correctAnswer}
                            onChange={e => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full font-mono bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-emerald-400 focus:outline-none focus:border-secondary/60 h-24 resize-none"
                            placeholder="def solve(n):\n    return n * 2"
                          />
                        </div>

                        {/* Coding testcases */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Test Cases</label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...questions];
                                updated[qIdx].codingDetails.testCases.push({ input: '', expectedOutput: '', isPublic: true });
                                setQuestions(updated);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-secondary hover:underline"
                            >
                              + Add Case
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            {q.codingDetails?.testCases?.map((tc, tcIdx) => (
                              <div key={tcIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                <input
                                  required
                                  type="text"
                                  value={tc.input}
                                  onChange={e => {
                                    const updated = [...questions];
                                    updated[qIdx].codingDetails.testCases[tcIdx].input = e.target.value;
                                    setQuestions(updated);
                                  }}
                                  placeholder="Input value"
                                  className="bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <input
                                  required
                                  type="text"
                                  value={tc.expectedOutput}
                                  onChange={e => {
                                    const updated = [...questions];
                                    updated[qIdx].codingDetails.testCases[tcIdx].expectedOutput = e.target.value;
                                    setQuestions(updated);
                                  }}
                                  placeholder="Expected output"
                                  className="bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 text-xs text-zinc-500 font-semibold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tc.isPublic}
                                      onChange={e => {
                                        const updated = [...questions];
                                        updated[qIdx].codingDetails.testCases[tcIdx].isPublic = e.target.checked;
                                        setQuestions(updated);
                                      }}
                                      className="rounded bg-zinc-800 border-zinc-800 focus:ring-secondary text-secondary"
                                    />
                                    Public
                                  </label>
                                  {q.codingDetails.testCases.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...questions];
                                        updated[qIdx].codingDetails.testCases = updated[qIdx].codingDetails.testCases.filter((_, i) => i !== tcIdx);
                                        setQuestions(updated);
                                      }}
                                      className="text-red-400 text-xs hover:underline font-bold"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-blue-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Create and Publish Exam
        </button>
      </form>
    </div>
  );
};

export default CreateExam;
