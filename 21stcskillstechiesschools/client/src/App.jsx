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

      <Route path="/about"   element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

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

// Generic static page template
const StaticPage = ({ title, children }) => (
  <div className="min-h-screen bg-background text-white p-8 md:p-16">
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl md:text-5xl font-black font-headline">{title}</h1>
      <div className="text-zinc-400 space-y-6 font-medium leading-relaxed">
        {children}
      </div>
      <div className="pt-12 border-t border-zinc-800">
        <a href="/" className="inline-block text-primary font-black uppercase tracking-widest text-xs hover:underline">← Back to Home</a>
      </div>
    </div>
  </div>
);

const AboutPage = () => (
  <StaticPage title="About 21stc Techies Schools">
    <p>We are dedicated to equipping students with the tools they need for the future. Through our AI Innovation Labs, we bring hands-on AI, Machine Learning, and Robotics education directly to school campuses.</p>
    <p>Our mission is to bridge the gap between traditional education and the rapidly evolving tech landscape, empowering the next generation of innovators and thinkers.</p>
  </StaticPage>
);

const ContactPage = () => (
  <StaticPage title="Contact Us">
    <p>Have questions about our programs or want to bring a lab to your school? We'd love to hear from you.</p>
    <ul className="space-y-2 mt-4">
      <li><strong>Email:</strong> support@21stcskills.com</li>
      <li><strong>Phone:</strong> +1 (555) 123-4567</li>
      <li><strong>HQ:</strong> Innovation Drive, Tech District</li>
    </ul>
  </StaticPage>
);

const PrivacyPage = () => (
  <StaticPage title="Privacy Policy">
    <p>Your privacy is our top priority. We collect only the necessary information to provide a seamless learning experience.</p>
    <p>Student data is strictly protected and never shared with third parties for marketing purposes. All educational records comply with standard data protection regulations.</p>
  </StaticPage>
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
