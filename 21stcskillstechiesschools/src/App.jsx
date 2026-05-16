import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLE_ROUTES } from './lib/mapping';
import Home                 from './pages/Home';
import Login                from './pages/Login';
import Register             from './pages/Register';
import StudentDashboard     from './pages/StudentDashboard';
import AdminDashboard       from './pages/AdminDashboard';
import TeacherPanel         from './pages/TeacherPanel';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import DashboardLayout      from './layouts/DashboardLayout';
import Community            from './pages/Community';

// ── Centralised route guard ─────────────────────────────────────────────────
const ProtectedRoute = ({ allowedRole, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)               return <Navigate to="/login"  replace />;
  if (user.role !== allowedRole) return <Navigate to={ROLE_ROUTES[user.role] || '/login'} replace />;
  return children;
};

// ── Auth-aware public route (redirect if already logged in) ────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={ROLE_ROUTES[user.role] || '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
        Initializing Portal Hub...
      </p>
    </div>
  );

  return (
    <Routes>
      {/* ── Public Pages ─────────────────────────────────────────────────── */}
      <Route path="/" element={<Home />} />

      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/about"   element={<ComingSoon title="About Us" />} />
      <Route path="/contact" element={<ComingSoon title="Contact" />} />
      <Route path="/privacy" element={<ComingSoon title="Privacy Policy" />} />

      {/* ── Protected Dashboard Shell ─────────────────────────────────────── */}
      <Route element={<DashboardLayout />}>
        <Route path="/student"      element={<ProtectedRoute allowedRole="student">      <StudentDashboard />     </ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute allowedRole="admin">        <AdminDashboard />       </ProtectedRoute>} />
        <Route path="/teacher"      element={<ProtectedRoute allowedRole="teacher">      <TeacherPanel />         </ProtectedRoute>} />
        <Route path="/school-admin" element={<ProtectedRoute allowedRole="school-admin"> <SchoolAdminDashboard /> </ProtectedRoute>} />

        <Route path="/community" element={<Community />} />
        {/* Generic /dashboard → role-specific route */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Redirect /dashboard to the correct role-specific path
const DashboardRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? (ROLE_ROUTES[user.role] || '/login') : '/login'} replace />;
};

// Placeholder for unbuilt pages
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-black font-headline text-white">{title}</h1>
      <p className="text-zinc-500 font-medium">This page is coming soon.</p>
      <a href="/" className="inline-block mt-4 text-primary font-black uppercase tracking-widest text-xs hover:underline">← Back Home</a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
