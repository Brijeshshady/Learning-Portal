import React from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Search, Bell, Settings, CheckCircle2, LogOut, AlertTriangle, Bug, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ToastContainer from '../components/ToastContainer';
import SettingsModal from '../components/SettingsModal';
import BugReportModal from '../components/BugReportModal';
import DB from '../lib/db';
import useStore from '../hooks/useStore';
import { markAllRead, markRead } from '../lib/store';
import AIChatWidget from '../components/AIChatWidget';

/* Map view params to readable titles per role */
const VIEW_TITLES = {
  admin: {
    dashboard: 'Command Center',
    users:     'User Registry',
    schools:   'Hub Registry',
    certificates: 'Certificate Ledger',
    activation:'License Management',
    attendance:'System Attendance',
    analytics: 'Platform Analytics',
    system:    'System Monitor',
    rollouts:  'Rollout Manager',
    bugs:      'Bug Tracker',
  },
  'school-admin': {
    overview:  'Institution Overview',
    users:     'Manage Users',
    attendance:'Hub Attendance',
    pending:   'Hub Pending Actions',
    certificates: 'Hub Certificates',
    analytics: 'Institution Reports',
    'rollout-log': 'System Updates',
  },
  teacher: {
    overview:    'Class Overview',
    students:    'Student Roster',
    attendance:  'Attendance Log',
    pending:     'Pending Inbox',
    submissions: 'Grade Management',
    certificates: 'Issue Certificates',
    curriculum:  'Syllabus View',
  },
  student: {
    overview: 'My Dashboard',
    'ai-lab': 'AI Innovation Lab',
    playground: 'Coding Playground',
    projects: 'My Projects',
    attendance: 'My Attendance',
    pending: 'My Pending',
    roadmap:  '36-Week Roadmap',
    certificates: 'My Certificates',
    support:  'Support Center',
  },
};

const ROLE_BADGE = {
  admin:         { label: 'Super Admin',   color: 'text-primary   bg-primary/10   border-primary/20' },
  'school-admin':{ label: 'School Admin',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  teacher:       { label: 'Teacher',       color: 'text-blue-400  bg-blue-500/10  border-blue-500/20' },
  student:       { label: 'Student',       color: 'text-secondary bg-secondary/10 border-secondary/20' },
};

const DashboardLayout = () => {
  const { user, logout }  = useAuth();
  const [searchParams] = useSearchParams();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showBugModal, setShowBugModal] = React.useState(false);
  const [pendingRollout, setPendingRollout] = React.useState(null);
  const [showRolloutBanner, setShowRolloutBanner] = React.useState(true);
  const { notifications, maintenanceMode, hubs = [] } = useStore();
  
  const myNotifications = notifications.filter(n => {
    if (!n.targetUser && !n.targetRole) return true; // global
    if (n.targetUser && n.targetUser === user?.id) return true; // user-specific
    if (n.targetRole && n.targetRole === user?.role) return true; // role-specific
    return false;
  });
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const role      = user?.role || 'student';

  React.useEffect(() => {
    if (role === 'school-admin') {
      DB.getPendingRollout()
        .then(res => {
          if (res && res.pending) {
            setPendingRollout(res.rollout);
          }
        })
        .catch(err => console.error('Failed to load pending rollout', err));
    }
  }, [role]);

  const titles    = VIEW_TITLES[role] || {};
  const defaultV  = Object.keys(titles)[0] || 'overview';
  const activeView = searchParams.get('v') || defaultV;
  const pageTitle  = titles[activeView] || 'Dashboard';
  const badge      = ROLE_BADGE[role] || ROLE_BADGE.student;

  // ─── Maintenance Mode (Global or Hub-specific) ───────────────────────────
  const userHub = hubs.find(h => h.id === user?.schoolId);
  const isHubInMaintenance = userHub?.maintenance?.active && user?.role !== 'admin';
  const isGlobalMaintenance = maintenanceMode && user?.role !== 'admin';

  if (isGlobalMaintenance || isHubInMaintenance) {
    const message = isHubInMaintenance 
      ? (userHub.maintenance.message || "This institutional hub is currently undergoing scheduled maintenance.")
      : "The 21stc Portal is currently undergoing global system maintenance.";
    
    const until = isHubInMaintenance ? userHub.maintenance.until : null;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-primary/5 opacity-50" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 blur-[120px] rounded-full animate-pulse" />
        </div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-lg w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse" />
            <AlertTriangle className="w-10 h-10 text-amber-500 relative z-10" />
          </div>
          
          <h1 className="text-3xl font-black font-headline tracking-tighter text-white mb-4 leading-tight">
            {isHubInMaintenance ? "Hub Lockdown Active" : "System Maintenance"}
          </h1>
          
          <p className="text-zinc-400 font-medium mb-8 leading-relaxed">
            {message}
          </p>
          
          {until && (
            <div className="bg-zinc-800/50 border border-white/5 rounded-2xl p-4 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Scheduled to Resume</p>
              <p className="text-sm font-bold text-amber-400">{new Date(until).toLocaleString()}</p>
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={logout}
              className="w-full bg-white text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              Please contact your Hub Administrator for support.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <header className="h-14 shrink-0 border-b border-outline-variant flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-3">
            <h1 className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
              {pageTitle}
            </h1>
            <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search…"
                className="w-56 bg-zinc-900/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-zinc-700"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 flex items-center justify-center transition-colors rounded-xl ${showNotifications ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[28rem]"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-blue-400 transition-colors">Mark all read</button>
                        )}
                      </div>
                      <div className="overflow-y-auto divide-y divide-zinc-800">
                        {myNotifications.length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-xs font-bold">No notifications</div>
                        ) : (
                          <>
                            {myNotifications.slice(0, 5).map((n) => (
                              <div key={n.id} onClick={() => markRead(n.id)} className={`p-4 flex gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                <div>
                                  <p className={`text-sm font-bold ${!n.read ? 'text-white' : 'text-zinc-400'}`}>{n.title}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">{n.time}</p>
                                </div>
                              </div>
                            ))}
                            {myNotifications.length > 5 && (
                              <button className="w-full p-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border-t border-zinc-800 bg-zinc-900/50">
                                View all {myNotifications.length} notifications
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Bug Report */}
            <button 
              onClick={() => setShowBugModal(true)}
              className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
              title="Submit Bug Report"
            >
              <Bug className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button 
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <button 
              onClick={() => setShowSettings(true)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white hover:opacity-80 transition-opacity ${
                role === 'admin' ? 'bg-primary' :
                role === 'school-admin' ? 'bg-emerald-500' :
                role === 'teacher' ? 'bg-blue-500' : 'bg-secondary'
              }`}
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* ── Page Content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-background relative flex flex-col">
          <div className="bg-grid-pattern absolute inset-0 opacity-30 pointer-events-none"></div>
          {pendingRollout && showRolloutBanner && (
            <div className="relative z-20 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-6 py-3 flex items-center justify-between text-xs text-amber-250 shrink-0">
              <div className="flex items-center gap-2 font-semibold">
                <ArrowUpCircle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <span>
                  Update <strong className="text-white">{pendingRollout.version} ({pendingRollout.channel})</strong> is available. 
                  It will be automatically applied next midnight (tomorrow at <strong className="text-white">{new Date(pendingRollout.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>).
                </span>
              </div>
              <button 
                onClick={() => setShowRolloutBanner(false)}
                className="text-amber-500 hover:text-white font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded bg-amber-500/5 hover:bg-amber-500/20 transition-all border border-amber-500/10"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="relative z-10 p-8 max-w-screen-xl mx-auto w-full flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toasts, Modals & AI */}
      <ToastContainer />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} />
      <BugReportModal isOpen={showBugModal} onClose={() => setShowBugModal(false)} />
      <AIChatWidget />
    </div>
  );
};

export default DashboardLayout;
