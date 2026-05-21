import React from 'react';
import { NavLink, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bot,
  Rocket,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  Database,
  Activity,
  Key,
  BarChart2,
  BookOpen,
  ClipboardList,
  UserCog,
  LogOut,
  ChevronRight,
  Zap,
  Award,
  Calendar,
  Inbox,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useStore from '../hooks/useStore';

/* ─── Per-role navigation configs ──────────────────────────────────────────────
   Each item either goes to an external route OR drives an internal "view"
   inside the dashboard page via ?v=<view> query param.
   ─────────────────────────────────────────────────────────────────────────── */
const MENUS = {
  admin: {
    label: 'Command',
    accent: { text: 'text-primary', bg: 'bg-primary', shadow: 'shadow-primary/30', ring: 'ring-primary/20' },
    links: [
      { name: 'Overview',      view: 'dashboard', icon: LayoutDashboard },
      { name: 'User Registry', view: 'users',     icon: Users },
      { name: 'Hub Registry',  view: 'schools',   icon: Database },
      { name: 'Certificates',  view: 'certificates', icon: Award },
      { name: 'Attendance',    view: 'attendance',   icon: Calendar },
      { name: 'License Keys',  view: 'activation',icon: Key },
      { name: 'Analytics',     view: 'analytics', icon: Activity },
      { name: 'Community',     route: '/community', icon: MessageSquare },
    ],
  },
  'school-admin': {
    label: 'Hub',
    accent: { text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/30', ring: 'ring-emerald-500/20' },
    links: [
      { name: 'Institution',  view: 'overview',   icon: ShieldCheck },
      { name: 'Manage Users', view: 'users',      icon: UserCog },
      { name: 'Attendance',   view: 'attendance', icon: Calendar },
      { name: 'Hub Pending',  view: 'pending',    icon: Inbox, badge: true },
      { name: 'Certificates', view: 'certificates', icon: Award },
      { name: 'Reports',      view: 'analytics',  icon: BarChart2 },
      { name: 'Community',    route: '/community', icon: MessageSquare },
    ],
  },
  teacher: {
    label: 'Teach',
    accent: { text: 'text-blue-400', bg: 'bg-blue-500', shadow: 'shadow-blue-500/30', ring: 'ring-blue-500/20' },
    links: [
      { name: 'Class Overview',  view: 'overview',     icon: LayoutDashboard },
      { name: 'Student List',    view: 'students',     icon: Users },
      { name: 'Attendance',      view: 'attendance',   icon: Calendar },
      { name: 'Pending Inbox',   view: 'pending',      icon: Inbox, badge: true },
      { name: 'Submissions',     view: 'submissions',  icon: ClipboardList },
      { name: 'Certificates',    view: 'certificates', icon: Award },
      { name: 'Syllabus View',   view: 'curriculum',   icon: BookOpen },
      { name: 'Community',       route: '/community',  icon: MessageSquare },
    ],
  },
  student: {
    label: 'Learn',
    accent: { text: 'text-secondary', bg: 'bg-secondary', shadow: 'shadow-secondary/30', ring: 'ring-secondary/20' },
    links: [
      { name: 'Dashboard',        view: 'overview',  icon: LayoutDashboard },
      { name: 'AI Lab',           view: 'ai-lab',    icon: Bot },
      { name: 'My Projects',      view: 'projects',  icon: Rocket },
      { name: 'Attendance',       view: 'attendance', icon: Calendar },
      { name: 'My Pending',       view: 'pending',    icon: Inbox, badge: true },
      { name: 'Weekly Roadmap',   view: 'roadmap',   icon: Zap },
      { name: 'Certificates',     view: 'certificates', icon: Award },
      { name: 'Leaderboard',      view: 'leaderboard',   icon: Trophy },
      { name: 'Community',        route: '/community', icon: MessageSquare },
      { name: 'Support',          view: 'support',   icon: HelpCircle },
    ],
  },
};

const ROUTE_FOR_ROLE = {
  admin:         '/admin',
  'school-admin':'/school-admin',
  teacher:       '/teacher',
  student:       '/student',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { submissions = [], grades = {}, leaves = [] } = useStore();

  const role   = user?.role || 'student';
  const config = MENUS[role] || MENUS.student;
  const { accent, label, links } = config;

  const baseRoute  = ROUTE_FOR_ROLE[role];
  const isOnMyBase = location.pathname === baseRoute;
  const activeView = searchParams.get('v') || links[0]?.view;

  const navigate = useNavigate();

  // Live pending count for teacher & student & school-admin badges
  const pendingSubsCount   = submissions.filter(s => !grades[s.id]).length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const totalPending = pendingSubsCount + pendingLeavesCount;

  // Student-specific pending: only their own submissions + leaves
  const myPendingSubsCount   = submissions.filter(s => s.studentId === user?.id && !grades[s.id]).length;
  const myPendingLeavesCount = leaves.filter(l => l.studentId === user?.id && l.status === 'pending').length;
  const myTotalPending = myPendingSubsCount + myPendingLeavesCount;

  const handleViewClick = (item) => {
    // Items with a `route` go to a full page path
    if (item.route) {
      navigate(item.route);
      return;
    }
    if (location.pathname !== baseRoute) {
      navigate(`${baseRoute}?v=${item.view}`, { replace: false });
    } else {
      setSearchParams({ v: item.view }, { replace: true });
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="w-64 shrink-0 h-screen bg-surface border-r border-outline-variant flex flex-col z-30">
      {/* ── Branding ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-outline-variant flex items-center gap-3 shrink-0">
        <div className={`w-9 h-9 ${accent.bg} rounded-xl flex items-center justify-center shadow-lg ${accent.shadow} shrink-0`}>
          <LayoutDashboard className="text-white w-4 h-4" />
        </div>
        <div>
          <p className="font-black text-[15px] font-headline tracking-tight text-white leading-none">
            21stc <span className={accent.text}>{label}</span>
          </p>
          <p className={`text-[9px] font-black uppercase tracking-[0.25em] ${accent.text} opacity-70 mt-0.5`}>
            {role.replace('-', ' ')}
          </p>
        </div>
      </div>

      {/* ── Nav Links ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.25em] px-3 mb-3">Navigation</p>
        {links.map((item) => {
          const badgeCount = item.badge
            ? (role === 'teacher' ? totalPending
              : role === 'student' ? myTotalPending
              : role === 'school-admin' ? totalPending
              : 0)
            : 0;
          const isActive = item.route
            ? location.pathname === item.route
            : isOnMyBase && activeView === item.view;
          return (
            <button
              key={item.name}
              onClick={() => handleViewClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 group text-left ${
                isActive
                  ? `${accent.bg} text-white shadow-md ${accent.shadow}`
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold flex-1">{item.name}</span>
              {badgeCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse shrink-0">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : item.route ? (
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 shrink-0">↗</span>
              ) : (
                <ChevronRight className={`w-3 h-3 transition-all shrink-0 ${isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-30'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Card ────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-outline-variant shrink-0">
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 ring-1 ${accent.ring}`}>
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-xl ${accent.bg} flex items-center justify-center text-white font-black text-xs shrink-0`}>
            {initials}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className={`text-[10px] ${accent.text} truncate font-semibold opacity-70`}>
              {role.replace('-', ' ')}
            </p>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            title="Sign Out"
            className="text-zinc-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
