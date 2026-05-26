import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Filter, Cpu, CheckCircle2, Lock, Rocket, Award, Activity, BookOpen, AlertCircle, Clock, ExternalLink, Calendar, Link } from 'lucide-react';
import useStore from '../hooks/useStore';
import { addProject, removeProject, addNotification, grantExtension, removeExtension } from '../lib/store';
import { PageHeader, SectionCard } from './DashboardShell';
import Modal from './Modal';

// Helper to determine gradient/text colors based on project type/module
export const getProjectStyles = (type) => {
  const t = (type || '').toUpperCase();
  if (t === 'IOT') return { borderClass: 'border-emerald-500/20', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' };
  if (t === 'AI') return { borderClass: 'border-primary/20', textClass: 'text-primary', bgClass: 'bg-primary/10' };
  if (t === 'ML') return { borderClass: 'border-secondary/20', textClass: 'text-secondary', bgClass: 'bg-secondary/10' };
  if (t === 'CODING') return { borderClass: 'border-blue-500/20', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10' };
  if (t === 'ROBOTICS') return { borderClass: 'border-amber-500/20', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10' };
  return { borderClass: 'border-purple-500/20', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10' };
};

const ProjectsManager = ({ userRole = 'teacher' }) => {
  const { projects = [], users = [], extensions = [] } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  
  // Resources local form state
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceList, setResourceList] = useState([]);

  // Extension Modal state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedProjectForExtension, setSelectedProjectForExtension] = useState(null);
  const [extensionStudentId, setExtensionStudentId] = useState('');
  const [extensionDeadline, setExtensionDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'AI',
    customType: '',
    week: 1,
    startWeek: 1,
    endWeek: 1,
    startDate: '',
    endDate: '',
    link: '',
    grade: 'All',
    desc: ''
  });

  const uniqueModules = ['AI', 'ML', 'IoT', 'Coding', 'Robotics', ...new Set(projects.map(p => p.type).filter(Boolean))];

  const handleCreateProject = (e) => {
    e.preventDefault();
    const finalType = formData.type === 'Custom' ? formData.customType.trim() : formData.type;
    if (!finalType) {
      alert('Please specify a project module/type.');
      return;
    }

    const startW = Number(formData.startWeek || formData.week || 1);
    const endW = Number(formData.endWeek || formData.startWeek || formData.week || 1);

    addProject({
      title: formData.title.trim(),
      type: finalType,
      week: startW,
      startWeek: startW,
      endWeek: endW,
      startDate: formData.startDate,
      endDate: formData.endDate,
      link: formData.link.trim(),
      resources: resourceList,
      grade: formData.grade,
      desc: formData.desc.trim()
    });

    addNotification({
      title: 'Project Created',
      body: `"${formData.title}" added under ${finalType} (Week ${startW} - ${endW}).`,
      type: 'success'
    });

    setShowCreateModal(false);
    setFormData({
      title: '',
      type: 'AI',
      customType: '',
      week: 1,
      startWeek: 1,
      endWeek: 1,
      startDate: '',
      endDate: '',
      link: '',
      grade: 'All',
      desc: ''
    });
    setResourceList([]);
    setResourceName('');
    setResourceUrl('');
  };

  const handleGrantExtension = (e) => {
    e.preventDefault();
    if (!extensionStudentId || !extensionDeadline || !selectedProjectForExtension) {
      alert('Please select a student and target deadline.');
      return;
    }

    grantExtension({
      studentId: extensionStudentId,
      projectId: selectedProjectForExtension.id,
      newDeadline: extensionDeadline,
      reason: extensionReason.trim()
    });

    const studentName = users.find(u => u.id === extensionStudentId)?.name || 'Student';
    addNotification({
      title: 'Extension Granted',
      body: `Submission extension for ${studentName} until ${extensionDeadline}.`,
      type: 'success',
      targetUser: extensionStudentId
    });

    setShowExtensionModal(false);
    setExtensionStudentId('');
    setExtensionDeadline('');
    setExtensionReason('');
  };

  const handleRemoveProject = (id, title) => {
    if (!confirm(`Are you sure you want to delete the project "${title}"?`)) return;
    removeProject(id);
    addNotification({
      title: 'Project Deleted',
      body: `"${title}" has been deleted.`,
      type: 'warning'
    });
  };

  const filteredProjects = projects.filter(p => {
    const matchesGrade = gradeFilter === 'ALL' || String(p.grade) === String(gradeFilter);
    const matchesModule = moduleFilter === 'ALL' || String(p.type).toUpperCase() === String(moduleFilter).toUpperCase();
    return matchesGrade && matchesModule;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <PageHeader title="Projects & Modules Manager" subtitle="Create, categorize, and roll out Capstone and module projects for students." />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Create Project
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span>Filters:</span>
        </div>
        
        <div>
          <label className="text-[8px] font-black uppercase text-zinc-650 block mb-1">Target Grade</label>
          <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700/80 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Grades</option>
            <option value="All">All-Grade Projects</option>
            {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase text-zinc-650 block mb-1">Module / Type</label>
          <select 
            value={moduleFilter} 
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700/80 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Modules</option>
            {uniqueModules.filter(m => m !== 'Custom').map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div className="ml-auto text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          {filteredProjects.length} Projects Available
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-16 text-center text-zinc-500 font-bold text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-800 mx-auto" />
            <p>No projects match your filter settings.</p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const styles = getProjectStyles(p.type);
            return (
              <motion.div
                key={p.id}
                layout
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`bg-zinc-950/40 border ${styles.borderClass} rounded-[2rem] p-6 flex flex-col justify-between hover:bg-zinc-950/60 transition-all duration-300 relative group`}
              >
                {/* Delete button (hover only) */}
                <button
                  onClick={() => handleRemoveProject(p.id, p.title)}
                  className="absolute top-4 right-4 w-7 h-7 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${styles.textClass} ${styles.bgClass} px-2.5 py-1 rounded-lg border ${styles.borderClass}`}>
                      {p.type}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-1 rounded-lg">
                      Week {p.startWeek && p.endWeek ? `${p.startWeek} - ${p.endWeek}` : p.week}
                    </span>
                    {(p.startDate || p.endDate) && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-zinc-550" />
                        {p.startDate && p.endDate ? `${p.startDate} to ${p.endDate}` : p.endDate ? `Due: ${p.endDate}` : `Start: ${p.startDate}`}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white leading-tight mb-2 pr-6">{p.title}</h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-4">{p.desc || 'No instructions provided.'}</p>

                  {/* Instructions Link */}
                  {p.link && (
                    <div className="mb-4">
                      <a 
                        href={p.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" /> Instruction Link
                      </a>
                    </div>
                  )}

                  {/* Resources */}
                  {p.resources && p.resources.length > 0 && (
                    <div className="mb-4 space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" /> Additional Resources:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.resources.map((res, idx) => (
                          <a 
                            key={idx} 
                            href={res.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded hover:bg-zinc-800 transition-all block truncate max-w-[150px]"
                          >
                            {res.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Extensions list */}
                  {(() => {
                    const projExtensions = extensions.filter(e => e.projectId === p.id);
                    if (projExtensions.length > 0) {
                      return (
                        <div className="mb-4 pt-3 border-t border-zinc-900/60 space-y-2">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-500" /> Active Extensions ({projExtensions.length})
                          </p>
                          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                            {projExtensions.map(ext => {
                              const studentName = users.find(u => u.id === ext.studentId)?.name || 'Unknown Student';
                              return (
                                <div key={ext.id} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-2 rounded-xl text-[10px] font-medium text-zinc-300">
                                  <div className="truncate pr-1">
                                    <span className="font-bold text-white block truncate">{studentName}</span>
                                    <span className="text-[9px] text-amber-400 font-bold">Until: {ext.newDeadline}</span>
                                    {ext.reason && <span className="text-zinc-500 block truncate italic text-[9px]">"{ext.reason}"</span>}
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Revoke extension for ${studentName}?`)) {
                                        removeExtension(ext.id);
                                        addNotification({ title: 'Extension Revoked', body: `Extension for ${studentName} removed.`, type: 'warning' });
                                      }
                                    }}
                                    className="text-zinc-500 hover:text-red-400 p-1 shrink-0 transition-colors"
                                    title="Revoke Extension"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="mt-auto">
                  <div className="border-t border-zinc-900/80 pt-4 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Target Cohort:</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      {p.grade === 'All' ? 'All Grades' : `Grade ${p.grade}`}
                    </span>
                  </div>
                  
                  {/* Grant Extension trigger button */}
                  <button
                    onClick={() => {
                      setSelectedProjectForExtension(p);
                      setExtensionStudentId('');
                      setExtensionDeadline('');
                      setExtensionReason('');
                      setShowExtensionModal(true);
                    }}
                    className="w-full mt-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-all focus:outline-none"
                  >
                    <Clock className="w-3 h-3 text-amber-500" /> Grant Extension
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Project Module">
        <form onSubmit={handleCreateProject} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Project Title</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Smart Irrigation System" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Start Week (1-36)</label>
              <input 
                required 
                type="number" 
                min="1" 
                max="36" 
                value={formData.startWeek} 
                onChange={(e) => setFormData({...formData, startWeek: e.target.value, week: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">End Week (1-36)</label>
              <input 
                required 
                type="number" 
                min="1" 
                max="36" 
                value={formData.endWeek} 
                onChange={(e) => setFormData({...formData, endWeek: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Start Date</label>
              <input 
                type="date" 
                value={formData.startDate} 
                onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">End Date / Deadline</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Target Grade</label>
              <select 
                value={formData.grade} 
                onChange={(e) => setFormData({...formData, grade: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="All">All Grades</option>
                {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Module / Type</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="AI">AI</option>
                <option value="ML">ML</option>
                <option value="IoT">IoT</option>
                <option value="Coding">Coding</option>
                <option value="Robotics">Robotics</option>
                <option value="Custom">Custom Module...</option>
              </select>
            </div>
          </div>

          {formData.type === 'Custom' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Custom Module Name</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Cyber Security" 
                value={formData.customType} 
                onChange={(e) => setFormData({...formData, customType: e.target.value})} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Description / Instructions</label>
            <textarea 
              placeholder="Provide assignment guidelines or instructions for the student..." 
              value={formData.desc} 
              onChange={(e) => setFormData({...formData, desc: e.target.value})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none h-20 resize-none" 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Instruction Link (GitHub / Doc URL)</label>
            <input 
              type="url" 
              placeholder="https://github.com/..." 
              value={formData.link} 
              onChange={(e) => setFormData({...formData, link: e.target.value})} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none" 
            />
          </div>

          {/* Resources */}
          <div className="border-t border-zinc-800 pt-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Additional Resource Guides / Files</label>
            
            {resourceList.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {resourceList.map((res, index) => (
                  <div key={index} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-xs">
                    <div className="truncate pr-2">
                      <span className="font-bold text-white block truncate">{res.name}</span>
                      <span className="text-zinc-500 text-[10px] block truncate">{res.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResourceList(resourceList.filter((_, idx) => idx !== index))}
                      className="text-red-400 hover:text-red-300 px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-lg shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl space-y-2">
              <input 
                type="text" 
                placeholder="Resource Title (e.g. API Documentation)" 
                value={resourceName} 
                onChange={(e) => setResourceName(e.target.value)} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" 
              />
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="URL (https://...)" 
                  value={resourceUrl} 
                  onChange={(e) => setResourceUrl(e.target.value)} 
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none" 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (resourceName.trim() && resourceUrl.trim()) {
                      setResourceList([...resourceList, { name: resourceName.trim(), url: resourceUrl.trim() }]);
                      setResourceName('');
                      setResourceUrl('');
                    } else {
                      alert('Please specify both resource name and URL.');
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            Create Project Module
          </button>
        </form>
      </Modal>

      {/* Grant Extension Modal */}
      <Modal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} title={`Grant Submission Extension: ${selectedProjectForExtension?.title}`}>
        <form onSubmit={handleGrantExtension} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Student</label>
            <select 
              required 
              value={extensionStudentId} 
              onChange={(e) => setExtensionStudentId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="" disabled>Select student...</option>
              {(() => {
                const extensionStudents = users.filter(u => {
                  if (u.role !== 'student') return false;
                  if (!selectedProjectForExtension) return true;
                  const projGrade = selectedProjectForExtension.grade;
                  return projGrade === 'All' || String(u.grade) === String(projGrade);
                });
                return extensionStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>
                ));
              })()}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Extended Deadline Date</label>
            <input 
              required
              type="date" 
              value={extensionDeadline} 
              onChange={(e) => setExtensionDeadline(e.target.value)} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 outline-none" 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Reason for Extension</label>
            <textarea 
              placeholder="e.g. Sick leave / technical difficulties / team adjustment..." 
              value={extensionReason} 
              onChange={(e) => setExtensionReason(e.target.value)} 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 outline-none h-20 resize-none" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-amber-500 text-black font-black py-3 rounded-xl mt-4 text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            Grant Extension
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsManager;
