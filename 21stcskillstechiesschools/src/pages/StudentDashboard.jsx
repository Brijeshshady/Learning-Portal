import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, Bot, Rocket, HelpCircle, Lock, ExternalLink, ChevronRight, MessageSquare, Award, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, KpiGrid, KpiCard, ChartRow,
  AreaChartCard, BarChartCard, ActivityFeed, SectionCard,
} from '../components/DashboardShell';
import Modal from '../components/Modal';
import DB from '../lib/db';



/* ── Overview ─────────────────────────────────────────────── */
const OverviewView = ({ user, setView, certificates = [], stats }) => {
  const name = user?.name?.split(' ')[0] || 'Explorer';
  const myCerts = certificates;
  
  const baseActivities = stats?.baseActivities || [];

  const certActivities = myCerts.map(cert => ({
    name: 'Certificate Earned',
    action: `Awarded: ${cert.title}`,
    time: cert.date === new Date().toISOString().split('T')[0] ? 'Today' : cert.date,
    tag: 'recent',
    avatar: '🏅',
    avatarBg: 'bg-yellow-500/20',
    avatarColor: 'text-yellow-500'
  }));

  const allActivities = [...certActivities, ...baseActivities].slice(0, 4);

  return (
    <div>
      <PageHeader title={`Welcome back, ${name}!`} subtitle="Here's your learning progress and what's happening this week." />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <motion.button 
          whileHover={{ y: -2 }}
          onClick={() => setView('ai-lab')}
          className="group relative overflow-hidden bg-primary p-6 rounded-[2rem] text-left shadow-xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Rocket className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-0.5">Recommended</p>
              <h3 className="text-lg font-black text-white">Continue Week 8 Module</h3>
            </div>
          </div>
        </motion.button>

        <motion.button 
          whileHover={{ y: -2 }}
          onClick={() => setView('roadmap')}
          className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Zap className="text-secondary w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Upcoming</p>
              <h3 className="text-lg font-black text-white">View Full Roadmap</h3>
            </div>
          </div>
        </motion.button>
      </div>

      <KpiGrid>
        <KpiCard label="Course Progress" value={stats?.kpis?.progress || "0%"}  change={stats?.kpis?.progressChange || "0%"}  changeLabel="this week"      icon={Zap}     iconBg="bg-secondary/15"  iconColor="text-secondary" delay={0.05} />
        <KpiCard label="Current Week"    value={stats?.kpis?.week || "1/36"}      change={stats?.kpis?.weekChange || "+0 week"}      changeLabel="unlocked"       icon={Rocket}  iconBg="bg-blue-500/15"   iconColor="text-blue-400"  delay={0.1} />
        <KpiCard label="AI Mastery"      value={stats?.kpis?.mastery || "0%"}      change={stats?.kpis?.masteryChange || "+0%"}       changeLabel="vs last module" icon={Bot}     iconBg="bg-emerald-500/15" iconColor="text-emerald-400" delay={0.15} />
        <KpiCard label="Skill Score"     value={stats?.kpis?.score || 0}       change={stats?.kpis?.scoreChange || "+0"}      changeLabel="total points"   icon={Cpu}     iconBg="bg-amber-500/15"  iconColor="text-amber-400" delay={0.2} />
      </KpiGrid>
      <ChartRow>
        <AreaChartCard title="Weekly Scores" subtitle="Your quiz and assignment scores over the last 7 weeks" data={stats?.weeklyData || []} dataKey="score" color="#8b5cf6" />
        <BarChartCard title="Skill Breakdown" subtitle="Your proficiency across core skill areas" data={stats?.skillData || []} dataKey="score" color="#3b82f6" />
      </ChartRow>
      <ActivityFeed title="Recent Activity" subtitle="Your latest learning actions" delay={0.3} items={allActivities} />
    </div>
  );
};

/* ── AI Lab ───────────────────────────────────────────────── */
const AILabView = () => {
  const [activeModule, setActiveModule] = useState(null);
  const [modalTab, setModalTab] = useState('video');
  
  const modules = [
    { title: 'Intro to Machine Learning',   week: 6, status: 'completed', progress: 100, desc: 'Foundational concepts of supervised learning.', duration: '45m' },
    { title: 'Neural Networks Basics',      week: 7, status: 'completed', progress: 100, desc: 'Perceptrons, activation functions, and backprop.', duration: '1h 15m' },
    { title: 'Natural Language Processing', week: 8, status: 'active',    progress: 45,  desc: 'Text vectorization, embeddings, and basic transformers.', duration: '2h' },
    { title: 'Computer Vision 101',         week: 9, status: 'locked',    progress: 0,   desc: 'CNN architecture, image filters, and classification.', duration: '1h 45m' },
    { title: 'AI Ethics & Society',         week: 10, status: 'locked',   progress: 0,   desc: 'Bias, fairness, and the societal impact of AI.', duration: '50m' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black font-headline tracking-tighter text-white">AI Innovation Lab</h2>
        <p className="text-zinc-500 text-sm mt-1">Immersive, hands-on artificial intelligence modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
            <SectionCard className={`h-full border transition-all duration-300 ${
              m.status === 'locked' ? 'opacity-40 border-zinc-800' :
              m.status === 'active' ? 'border-secondary/40 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)] bg-gradient-to-b from-secondary/[0.05] to-transparent' :
              'border-zinc-800 hover:border-zinc-700'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  m.status === 'active' ? 'bg-secondary/20 shadow-inner shadow-secondary/40' : 
                  m.status === 'completed' ? 'bg-emerald-500/10' : 'bg-zinc-900'
                }`}>
                  {m.status === 'active' ? <Bot className="w-6 h-6 text-secondary" /> : 
                   m.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> :
                   <Lock className="w-5 h-5 text-zinc-600" />}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-2 py-1 rounded-md">Wk {m.week}</span>
                  <span className="text-[9px] font-bold text-zinc-600 mt-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> {m.duration}</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white leading-tight mb-2">{m.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{m.desc}</p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-zinc-800/50">
                  {m.status === 'active' ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-500">Progress</span><span className="text-secondary">{m.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-secondary to-purple-400 rounded-full" />
                      </div>
                      <button onClick={() => { setActiveModule(m); setModalTab('video'); }} className="w-full mt-2 bg-secondary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-purple-500 hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2">
                        <Rocket className="w-3.5 h-3.5" /> Continue Module
                      </button>
                    </div>
                  ) : m.status === 'completed' ? (
                    <button onClick={() => { setActiveModule(m); setModalTab('video'); }} className="w-full bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-zinc-700 hover:text-white transition-all">Review Material</button>
                  ) : (
                    <button disabled className="w-full bg-zinc-900/50 text-zinc-600 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl cursor-not-allowed border border-zinc-800/50">Locked</button>
                  )}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={!!activeModule} onClose={() => setActiveModule(null)} title={`Week ${activeModule?.week}: ${activeModule?.title}`} size="4xl">
        <div className="flex flex-col h-[70vh] max-h-[800px] -m-6 bg-zinc-950">
          
          {/* Modal Header Tabs */}
          <div className="flex px-6 pt-6 gap-2 border-b border-zinc-800">
            {[
              { id: 'video', label: 'Lecture', icon: Rocket },
              { id: 'resources', label: 'Resources', icon: Database },
              { id: 'editor', label: 'Interactive IDE', icon: Cpu }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setModalTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                  modalTab === tab.id ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Modal Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {modalTab === 'video' && (
                <motion.div key="video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* High Fidelity Thumbnail generated via generate_image */}
                  <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group cursor-pointer shadow-2xl">
                    <img src="/ai_lab_thumbnail_1778365956246.png" alt="Neural Networks Masterclass" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                      <div className="w-20 h-20 bg-secondary/90 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.6)] group-hover:scale-110 group-hover:bg-purple-500 transition-all backdrop-blur-md">
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-white font-mono">{activeModule?.duration}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{activeModule?.title}</h3>
                    <p className="text-zinc-400 mt-2 leading-relaxed text-sm">{activeModule?.desc} In this module, we will explore the mathematical foundations of the algorithms driving modern artificial intelligence. By the end of this lecture, you will be able to construct and train your first model from scratch.</p>
                  </div>
                </motion.div>
              )}

              {modalTab === 'resources' && (
                <motion.div key="resources" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Training Dataset', type: 'CSV', size: '1.2 MB', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                      { name: 'Starter Template', type: 'PY', size: '4 KB', icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { name: 'Lecture Slides', type: 'PDF', size: '5.8 MB', icon: BookOpen, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                      { name: 'API Documentation', type: 'LINK', size: 'External', icon: ExternalLink, color: 'text-zinc-300', bg: 'bg-zinc-800/80 border-zinc-700' }
                    ].map(res => (
                      <div key={res.name} className={`flex items-center p-4 rounded-2xl border ${res.bg} hover:brightness-125 transition-all cursor-pointer group`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${res.color} bg-white/5 mr-4`}>
                          <res.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-white transition-colors">{res.name}</h4>
                          <p className="text-xs text-zinc-500 font-medium">{res.type} • {res.size}</p>
                        </div>
                        <Download className={`w-5 h-5 ${res.color} opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {modalTab === 'editor' && (
                <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                  <div className="bg-[#0D1117] border border-zinc-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono font-medium ml-2">main.py</span>
                      </div>
                      <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors">
                        <Zap className="w-3 h-3" /> Run Code
                      </button>
                    </div>
                    <div className="p-4 font-mono text-xs text-zinc-300 leading-loose flex-1 overflow-y-auto">
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">1</span><span className="text-purple-400">import</span> <span className="text-emerald-400">numpy</span> <span className="text-purple-400">as</span> np</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">2</span><span className="text-purple-400">import</span> <span className="text-emerald-400">tensorflow</span> <span className="text-purple-400">as</span> tf</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">3</span></div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">4</span><span className="text-zinc-500 italic"># Initialize a simple sequential model</span></div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">5</span>model = tf.keras.Sequential([</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">6</span>    tf.keras.layers.Dense(<span className="text-amber-400">128</span>, activation=<span className="text-emerald-300">'relu'</span>),</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">7</span>    tf.keras.layers.Dropout(<span className="text-amber-400">0.2</span>),</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">8</span>    tf.keras.layers.Dense(<span className="text-amber-400">10</span>, activation=<span className="text-emerald-300">'softmax'</span>)</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">9</span>])</div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">10</span></div>
                      <div className="flex"><span className="w-8 text-zinc-600 select-none">11</span><span className="text-zinc-500 italic"># Compile the model...</span></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur flex justify-between items-center rounded-b-2xl">
            <span className="text-xs text-zinc-500 font-medium">Earn +15 points for completing this module.</span>
            <button onClick={() => {
              addNotification({ title: 'Module Completed', body: 'You have earned 15 skill points!', type: 'success' });
              setActiveModule(null);
            }} className="bg-secondary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-purple-600 transition-all shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Mark as Completed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ── Projects ─────────────────────────────────────────────── */
const ProjectsView = () => (
  <div className="space-y-6">
    <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">My Projects</h2><p className="text-zinc-500 text-sm mt-1">Capstone and module projects you have built.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: 'Smart Room Controller', week: 3, type: 'IoT', grade: 'A',   borderClass: 'border-emerald-500/20', textClass: 'text-emerald-400' },
        { title: 'AI Chatbot v1',         week: 5, type: 'AI',  grade: 'B+',  borderClass: 'border-primary/20',     textClass: 'text-primary' },
        { title: 'Neural Logic Trainer',  week: 7, type: 'ML',  grade: null,  borderClass: 'border-secondary/20',   textClass: 'text-secondary' },
      ].map((p) => (
        <SectionCard key={p.title} className={`border ${p.borderClass}`}>
          <div className="flex items-start justify-between mb-3">
            <span className={`text-[9px] font-black uppercase tracking-widest ${p.textClass} bg-white/5 px-2 py-1 rounded-lg`}>{p.type}</span>
            {p.grade
              ? <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">Grade: {p.grade}</span>
              : <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">In Progress</span>
            }
          </div>
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Week {p.week}</p>
          <h3 className="text-base font-black text-white mb-4">{p.title}</h3>
          <button className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${p.borderClass} ${p.textClass} hover:bg-white/5 transition-all flex items-center justify-center gap-2`}>
            <ExternalLink className="w-3.5 h-3.5" /> View Project
          </button>
        </SectionCard>
      ))}
    </div>
  </div>
);

/* ── Roadmap ──────────────────────────────────────────────── */
const RoadmapView = ({ setView }) => (
  <div className="space-y-6">
    <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Your 36-Week Journey</h2><p className="text-zinc-500 text-sm mt-1">Week 7 active — complete each week to unlock the next.</p></div>
    <SectionCard>
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
        {[...Array(36)].map((_, i) => (
          <div 
            key={i} 
            onClick={() => setView('ai-lab')}
            className={`aspect-square rounded-xl border flex items-center justify-center text-[9px] font-black transition-all cursor-pointer hover:scale-110 active:scale-95 ${
            i < 6  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' :
            i === 6 ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-110 hover:brightness-110' :
            'bg-zinc-800/50 border-zinc-700 text-zinc-600 opacity-40 hover:opacity-100'
          }`}>{i + 1}</div>
        ))}
      </div>
    </SectionCard>
    <div className="grid grid-cols-3 gap-4">
      {[{ label: 'Completed', value: '6', cls: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' }, { label: 'In Progress', value: '1', cls: 'text-primary border-primary/20 bg-primary/5' }, { label: 'Remaining', value: '29', cls: 'text-zinc-500 border-zinc-700 bg-zinc-800/50' }].map((s) => (
        <div key={s.label} className={`${s.cls} border rounded-2xl p-5 text-center`}><p className={`text-3xl font-black font-headline ${s.cls.split(' ')[0]}`}>{s.value}</p><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p></div>
      ))}
    </div>
  </div>
);

/* ── Support ──────────────────────────────────────────────── */
const SupportView = () => (
  <div className="space-y-6">
    <div><h2 className="text-2xl font-black font-headline tracking-tighter text-white">Support Center</h2><p className="text-zinc-500 text-sm mt-1">Get help from your teacher or the 21stc team.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard><div className="flex flex-col gap-4"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><MessageSquare className="text-primary w-5 h-5" /></div><h3 className="text-base font-black text-white">Ask Your Teacher</h3><p className="text-zinc-500 text-sm">Send a direct message to Ms. Kavitha for lesson help.</p><button className="bg-primary text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">Open Message</button></div></SectionCard>
      <SectionCard><div className="flex flex-col gap-4"><div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center"><HelpCircle className="text-secondary w-5 h-5" /></div><h3 className="text-base font-black text-white">FAQ & Guides</h3><p className="text-zinc-500 text-sm">Browse answers to common questions about the curriculum.</p><button className="bg-secondary text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-secondary/20">Browse FAQs</button></div></SectionCard>
    </div>
    <SectionCard title="Common Questions">
      {['How do I unlock the next week?', 'Where can I rewatch module videos?', 'How is my grade calculated?', 'Can I submit late assignments?'].map((q) => (
        <div key={q} className="flex items-center justify-between py-3.5 border-b border-zinc-800 last:border-0 hover:bg-white/[0.01] -mx-2 px-2 rounded-xl transition-all cursor-pointer group">
          <span className="text-sm font-medium text-zinc-300">{q}</span>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
        </div>
      ))}
    </SectionCard>
  </div>
);

/* ── Certificates ─────────────────────────────────────────── */
const CertificatesView = ({ user, certificates = [] }) => {
  const myCerts = certificates;

  const handleDownload = (certId) => {
    // Mock PDF export action
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-white">My Certificates</h2>
          <p className="text-zinc-500 text-sm mt-1">Credentials you have earned across modules.</p>
        </div>
      </div>
      
      {myCerts.length === 0 ? (
        <div className="border border-zinc-800 border-dashed rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-black text-white">No Certificates Yet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">Complete your learning modules and projects to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myCerts.map((cert) => (
            <SectionCard key={cert.id} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/5 opacity-50"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-yellow-500" />
                  </div>
                  <span className="text-[9px] font-black bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-400 uppercase tracking-widest">{cert.date}</span>
                </div>
                <h3 className="text-xl font-black font-headline text-white mb-1">{cert.title}</h3>
                <p className="text-xs font-bold text-zinc-500 mb-6">Issued by: {cert.issuedBy}</p>
                
                <div className="mt-auto space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Credential ID</span>
                    <span className="text-xs font-mono font-bold text-primary">{cert.id}</span>
                  </div>
                  <button onClick={() => handleDownload(cert.id)} className="w-full bg-zinc-800 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors border border-zinc-700">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────── */
const StudentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeView = searchParams.get('v') || 'overview';
  
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState(null);

  React.useEffect(() => {
    if (user?.id) {
      Promise.all([
        DB.getCertificates({ studentId: user.id }),
        DB.getDashboardStats('student', user.id)
      ]).then(([certs, s]) => {
        setCertificates(certs);
        setStats(s);
      });
    }
  }, [user?.id]);

  const views = {
    overview: <OverviewView user={user} setView={(v) => setSearchParams({ v })} certificates={certificates} stats={stats} />,
    'ai-lab': <AILabView />,
    projects: <ProjectsView />,
    roadmap:  <RoadmapView setView={(v) => setSearchParams({ v })} />,
    certificates: <CertificatesView user={user} certificates={certificates} />,
    support:  <SupportView />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        {views[activeView] || views.overview}
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentDashboard;
