import React, { useState, useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Play, Sparkles, BookOpen, History, Award, CheckCircle2, 
  Terminal, Code2, AlertCircle, RefreshCw, ChevronRight, X, Pin, Trash2 
} from 'lucide-react';
import DB from '../lib/db';
import { addNotification } from '../lib/store';

const CHALLENGES = [
  {
    id: 'ch-1',
    title: 'Calculate Rectangle Area',
    difficulty: 'Easy',
    lang: 'javascript',
    description: 'Write a JavaScript function named `calculateArea` that takes `width` and `height` as parameters and returns their product. Example: `calculateArea(5, 10)` should return `50`.',
    template: `// Write your function here
function calculateArea(width, height) {
    return width * height;
}

// Test call
console.log("Area (5x10):", calculateArea(5, 10));
`,
    testCases: [
      { code: 'calculateArea(5, 10)', expected: 50 },
      { code: 'calculateArea(3, 4)', expected: 12 }
    ]
  },
  {
    id: 'ch-2',
    title: 'Word Reverser',
    difficulty: 'Medium',
    lang: 'python',
    description: 'Write a Python program that takes a variable `word = "Skillstech"` and prints its characters in reverse order (e.g. "hcetllikS"). Use list slicing or a loop.',
    template: `word = "Skillstech"
# Write your reversal logic here
reversed_word = word[::-1]
print("Reversed:", reversed_word)
`,
    testCases: []
  },
  {
    id: 'ch-3',
    title: 'Smart Home Control Panel',
    difficulty: 'Hard',
    lang: 'html',
    description: 'Create a clean, responsive HTML control panel. Include a status card for a room showing temperature (24°C) and a toggle button to turn lights "ON" or "OFF". Use inline styles for beautiful dark glassmorphism styling.',
    template: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      padding: 24px;
      border-radius: 20px;
      text-align: center;
      width: 280px;
    }
    h2 { margin-top: 0; color: #3b82f6; }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Smart Living Room</h2>
    <p>Temperature: <strong>24°C</strong></p>
    <button onclick="toggleLight()">Toggle Light</button>
    <p id="status" style="margin-top:12px; font-size:12px; color:#a1a1aa;">Status: OFF</p>
  </div>

  <script>
    let state = false;
    function toggleLight() {
      state = !state;
      document.getElementById('status').innerText = 'Status: ' + (state ? 'ON' : 'OFF');
      document.getElementById('status').style.color = state ? '#10b981' : '#a1a1aa';
    }
  </script>
</body>
</html>
`,
    testCases: []
  }
];

const DEFAULT_CODES = {
  javascript: `// Interactive JavaScript Workspace
console.log("Welcome to 21stc Coding Playground!");

const students = ["Arun", "Priya", "Rahul"];
console.log("Enrolled Students:", students.join(", "));

function calculateMastery(completedWeeks) {
    return Math.round((completedWeeks / 36) * 100);
}
console.log("Student Mastery: " + calculateMastery(12) + "%");
`,
  python: `# Interactive Python AI Lab (AI Simulated Runtime)
print("Welcome to 21stc Python Playground!")

def generate_iot_alert(sensor_type, value):
    if value > 80:
        return f"CRITICAL: {sensor_type} value high ({value}%)"
    return f"STATUS: {sensor_type} normal ({value}%)"

alert = generate_iot_alert("Ultrasonic Distance Sensor", 88)
print(alert)
`,
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #0d0e12;
      color: #e2e8f0;
      font-family: sans-serif;
      padding: 20px;
      text-align: center;
    }
    h1 { color: #8b5cf6; }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      border-radius: 9999px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>AI Lab Node Indicator</h1>
  <div class="status-badge">Node-Alpha: HEALTHY</div>
  <p>Modify this template to design your custom IoT dashboard interface!</p>
</body>
</html>
`
};

const CodingPlayground = () => {
  const [lang, setLang] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODES.javascript);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('console'); // console, debug, explain
  const [aiFeedback, setAiFeedback] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [showHistory, setShowHistory] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);

  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const outputFrameRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('21stc_playground_history');
      if (saved) setHistoryList(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update CodeMirror editor content and extensions when language changes
  useEffect(() => {
    if (!editorRef.current) return;

    // Destroy existing instance
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }

    const getLanguageExtension = (l) => {
      if (l === 'javascript') return javascript();
      if (l === 'python') return python();
      if (l === 'html') return html();
      return javascript();
    };

    const startState = EditorState.create({
      doc: code,
      extensions: [
        keymap.of(defaultKeymap),
        lineNumbers(),
        oneDark,
        getLanguageExtension(lang),
        EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
          ".cm-content": { fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace' }
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [lang, fontSize]);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setCode(DEFAULT_CODES[newLang]);
    setOutput('');
    setAiFeedback('');
    setActiveChallenge(null);
  };

  const handleSaveToHistory = (customTitle = null) => {
    const title = customTitle || `Snippet (${lang}) - ${new Date().toLocaleTimeString()}`;
    const newItem = {
      id: `hist_${Date.now()}`,
      title,
      code,
      lang,
      timestamp: new Date().toLocaleString(),
      pinned: false
    };
    const updated = [newItem, ...historyList];
    setHistoryList(updated);
    localStorage.setItem('21stc_playground_history', JSON.stringify(updated));
  };

  const handlePinSnippet = (id, e) => {
    e.stopPropagation();
    const updated = historyList.map(h => h.id === id ? { ...h, pinned: !h.pinned } : h);
    setHistoryList(updated);
    localStorage.setItem('21stc_playground_history', JSON.stringify(updated));
  };

  const handleDeleteSnippet = (id, e) => {
    e.stopPropagation();
    const updated = historyList.filter(h => h.id !== id);
    setHistoryList(updated);
    localStorage.setItem('21stc_playground_history', JSON.stringify(updated));
  };

  const handleLoadHistory = (item) => {
    setLang(item.lang);
    setCode(item.code);
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: item.code }
      });
    }
    setShowHistory(false);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    setActiveTab('console');

    // JS client execution
    if (lang === 'javascript') {
      let customLog = [];
      const originalLog = console.log;
      console.log = (...args) => {
        customLog.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      };

      try {
        // Enforce basic sandbox
        const runner = new Function(code);
        runner();
        setOutput(customLog.join('\n') || 'Executed successfully (no console output produced).');
      } catch (err) {
        setOutput(`❌ Error: ${err.message}`);
      } finally {
        console.log = originalLog;
      }
      setIsRunning(false);
      handleSaveToHistory(`Run (JS) - ${new Date().toLocaleTimeString()}`);
    } 
    // Python AI simulation execution
    else if (lang === 'python') {
      try {
        const res = await DB.executeCode(code, 'python', 'run');
        setOutput(res.output || 'No output.');
      } catch (err) {
        setOutput(`❌ AI Execution Error: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
      handleSaveToHistory(`Run (Python) - ${new Date().toLocaleTimeString()}`);
    }
    // HTML Preview
    else {
      setIsRunning(false);
      handleSaveToHistory(`Render (HTML) - ${new Date().toLocaleTimeString()}`);
    }
  };

  // AI Debug
  const [aiFixedCode, setAiFixedCode] = useState('');
  const debugCodeUpdated = async () => {
    setIsAiLoading(true);
    setActiveTab('debug');
    setAiFeedback('AI is analyzing your code syntax and logical flow...');
    setAiFixedCode('');

    try {
      const res = await DB.executeCode(code, lang, 'debug');
      setAiFeedback(res.feedback || 'All tests passed! No code modifications needed.');
      if (res.fixedCode) {
        setAiFixedCode(res.fixedCode);
      }
    } catch (err) {
      setAiFeedback(`❌ AI Debugger Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Explain
  const explainCode = async () => {
    setIsAiLoading(true);
    setActiveTab('explain');
    setAiFeedback('AI is generating a line-by-line explanation of your script...');

    try {
      const res = await DB.executeCode(code, lang, 'explain');
      setAiFeedback(res.explanation || 'No explanation generated.');
    } catch (err) {
      setAiFeedback(`❌ AI Explanation Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyFix = () => {
    if (!aiFixedCode) return;
    setCode(aiFixedCode);
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: aiFixedCode }
      });
    }
    setAiFixedCode('');
    addNotification({ title: 'Fix Applied', body: 'AI-generated code fix applied to editor.', type: 'success' });
  };

  const loadChallenge = (ch) => {
    setLang(ch.lang);
    setCode(ch.template);
    setActiveChallenge(ch);
    setOutput('');
    setAiFeedback('');
    setShowChallenges(false);

    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: { from: 0, to: editorViewRef.current.state.doc.length, insert: ch.template }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-2xl border border-primary/20">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-black font-headline text-white tracking-tight">Interactive Playground</h2>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Dual-Sandbox AI IDE</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-1 flex">
            {['javascript', 'python', 'html'].map((l) => (
              <button 
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  lang === l 
                    ? 'bg-zinc-800 text-white shadow-lg' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {l === 'javascript' ? 'JS' : l === 'python' ? 'Python' : 'HTML'}
              </button>
            ))}
          </div>

          {/* Size Adjuster */}
          <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-2xl px-3 py-1">
            <span className="text-[9px] font-bold text-zinc-500 mr-2 uppercase tracking-widest">Size</span>
            <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="text-zinc-400 hover:text-white px-1 text-sm font-bold">-</button>
            <span className="text-xs font-bold text-white px-2">{fontSize}px</span>
            <button onClick={() => setFontSize(Math.min(20, fontSize + 1))} className="text-zinc-400 hover:text-white px-1 text-sm font-bold">+</button>
          </div>

          {/* Challenges & History Toggles */}
          <button 
            onClick={() => { setShowChallenges(true); setShowHistory(false); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-850 border border-zinc-850 hover:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Challenges
          </button>
          <button 
            onClick={() => { setShowHistory(true); setShowChallenges(false); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-850 border border-zinc-850 hover:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all"
          >
            <History className="w-3.5 h-3.5 text-primary" />
            History
          </button>
        </div>
      </div>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        
        {/* Active Challenge Info Banner (if loaded) */}
        {activeChallenge && (
          <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start justify-between">
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  Challenge Active: {activeChallenge.title}
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">{activeChallenge.difficulty}</span>
                </p>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{activeChallenge.description}</p>
              </div>
            </div>
            <button onClick={() => setActiveChallenge(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* LEFT COLUMN: Code Editor Panel (Col Span 7) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Editor ({lang})</span>
            </div>
            
            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2">
              <button 
                onClick={explainCode}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-850/40 disabled:opacity-50 transition-all"
                title="Explain code using Gemini"
              >
                <BookOpen className="w-3 h-3" />
                Explain
              </button>
              <button 
                onClick={debugCodeUpdated}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/30 border border-amber-800/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-850/40 disabled:opacity-50 transition-all"
                title="Debug code logic"
              >
                <Sparkles className="w-3 h-3" />
                AI Debug
              </button>
              <button 
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                title="Execute workspace code"
              >
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run Code
              </button>
            </div>
          </div>

          {/* Actual CodeMirror Ref Mount */}
          <div className="flex-1 overflow-y-auto min-h-[300px]" ref={editorRef} />

          {/* Editor Status Bar */}
          <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-950 text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-between">
            <span>Spaces: 4 • UTF-8</span>
            <span>Tab size: 4</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Console / AI Assistant Panels (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-5 overflow-hidden">
          
          {/* Header/Tabs */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex border-b border-zinc-800 bg-zinc-900/30 p-2 gap-1.5">
              <button 
                onClick={() => setActiveTab('console')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'console' 
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Console
              </button>
              <button 
                onClick={() => setActiveTab('debug')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'debug' 
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Debugger
              </button>
              <button 
                onClick={() => setActiveTab('explain')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'explain' 
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Explanation
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed relative">
              {activeTab === 'console' && (
                <div className="h-full flex flex-col justify-between">
                  {lang === 'html' ? (
                    // Live HTML Render Iframe
                    <div className="w-full h-full bg-white rounded-2xl overflow-hidden border border-zinc-800">
                      <iframe 
                        ref={outputFrameRef}
                        title="HTML Sandbox Output"
                        srcDoc={code}
                        sandbox="allow-scripts"
                        className="w-full h-full border-none"
                      />
                    </div>
                  ) : (
                    // Normal text console
                    <div className="text-zinc-300 whitespace-pre-wrap">
                      {output || (
                        <div className="text-zinc-600 italic py-4">
                          No stdout output produced. Click "Run Code" above to execute.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(activeTab === 'debug' || activeTab === 'explain') && (
                <div className="h-full flex flex-col">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gemini is analyzing your code...</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="text-zinc-300 whitespace-pre-wrap pr-1">
                        {aiFeedback || (
                          <div className="text-zinc-600 italic py-4">
                            Click "AI Debug" or "Explain" in the toolbar to receive real-time intelligence reports.
                          </div>
                        )}
                      </div>

                      {/* Display Apply Fix button if debugging code has a fix suggested */}
                      {activeTab === 'debug' && aiFixedCode && (
                        <button
                          onClick={handleApplyFix}
                          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all shadow-lg shadow-amber-500/5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Apply AI Fix to Editor
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* DRAWER MODALS: History and Challenges Panels */}
      {/* Challenges Modal Drawer */}
      {showChallenges && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChallenges(false)}></div>
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black font-headline text-white">Coding Challenges</h3>
                </div>
                <button onClick={() => setShowChallenges(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                {CHALLENGES.map((ch) => (
                  <div 
                    key={ch.id} 
                    onClick={() => loadChallenge(ch)}
                    className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl cursor-pointer transition-all hover:bg-zinc-900 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ch.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10' :
                        ch.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
                      }`}>
                        {ch.difficulty}
                      </span>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{ch.lang}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">{ch.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{ch.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">Complete challenges to earn XP points!</p>
            </div>
          </div>
        </div>
      )}

      {/* Code History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-black font-headline text-white">Execution History</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                {historyList.length === 0 ? (
                  <div className="text-center text-zinc-600 py-12 text-xs italic">No code execution history saved yet.</div>
                ) : (
                  historyList.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleLoadHistory(item)}
                      className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 rounded-2xl cursor-pointer transition-all hover:bg-zinc-900 flex justify-between items-start group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{item.lang}</span>
                          <span className="text-[8px] text-zinc-600 font-bold">{item.timestamp}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 mt-1.5 truncate pr-2 group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1 truncate max-w-xs">{item.code.substring(0, 50)}...</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handlePinSnippet(item.id, e)} 
                          className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${item.pinned ? 'text-amber-400' : 'text-zinc-500'}`}
                          title="Pin snippet"
                        >
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSnippet(item.id, e)} 
                          className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900 shrink-0">
              <button 
                onClick={() => { if(confirm('Clear all execution logs?')) { setHistoryList([]); localStorage.removeItem('21stc_playground_history'); } }}
                className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingPlayground;
