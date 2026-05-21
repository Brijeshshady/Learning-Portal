import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DB from '../lib/db';
import { getState } from '../lib/store';
import { ROLE_ROUTES, VALID_ROLES } from '../lib/mapping';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: re-hydrate session from localStorage on first load ──────────
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role       = localStorage.getItem('userRole');
    const email      = localStorage.getItem('userEmail');
    const token      = localStorage.getItem('userToken');

    if (isLoggedIn && VALID_ROLES.includes(role) && email && token) {
      // Verify user still exists in store/DB to prevent stale redirects
      const storeUsers = getState().users || [];
      const exists = storeUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (exists) {
        let grades = exists.grades;
        const storedGrades = localStorage.getItem('userGrades');
        if (storedGrades) {
          try { grades = JSON.parse(storedGrades); } catch (e) {}
        }
        setUser({
          id:       localStorage.getItem('userId') || exists.id,
          name:     localStorage.getItem('userName')  || exists.name,
          email:    email,
          role:     role,
          token:    token,
          schoolId: localStorage.getItem('schoolCode') || exists.schoolId,
          grades:   grades || [],
        });
      } else {
        // User no longer in system, purge session
        ['isLoggedIn', 'userRole', 'userId', 'userName', 'userEmail', 'userToken', 'schoolCode', 'userGrades'].forEach(k => localStorage.removeItem(k));
        setUser(null);
      }
    } else if (isLoggedIn || role || email || token) {
      // Clear corrupted/partial session data
      ['isLoggedIn', 'userRole', 'userId', 'userName', 'userEmail', 'userToken', 'schoolCode', 'userGrades'].forEach(k => localStorage.removeItem(k));
    }
    setLoading(false);
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const dbUser = await DB.login(email, password);
    
    if (!dbUser || !dbUser.token) {
      throw new Error('Invalid email or password. Please try again.');
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId',     dbUser.id);
    localStorage.setItem('userRole',   dbUser.role);
    localStorage.setItem('userName',   dbUser.name);
    localStorage.setItem('userEmail',  dbUser.email);
    localStorage.setItem('userToken',  dbUser.token);
    if (dbUser.schoolId) localStorage.setItem('schoolCode', dbUser.schoolId);
    if (dbUser.grades) localStorage.setItem('userGrades', JSON.stringify(dbUser.grades));

    const sessionUser = {
      id:       dbUser.id,
      name:     dbUser.name,
      email:    dbUser.email,
      role:     dbUser.role,
      token:    dbUser.token,
      schoolId: dbUser.schoolId || null,
      grades:   dbUser.grades || [],
    };
    setUser(sessionUser);
    return sessionUser;
  }, []);

  // ── Update Profile ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => {
          const newUser = { ...prev, ...data };
          if (newUser.name) localStorage.setItem('userName', newUser.name);
          if (newUser.email) localStorage.setItem('userEmail', newUser.email);
          return newUser;
        });
      }
    } catch (err) {
      console.error("Failed to update profile on backend:", err);
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Remove only auth-related keys, preserve platform state
    ['isLoggedIn', 'userRole', 'userId', 'userName', 'userEmail', 'userToken', 'schoolCode', 'userGrades'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    // Hard navigate so the entire app re-mounts cleanly
    window.location.replace('/login');
  }, []);

  // ── Dashboard route for current user ───────────────────────────────────────
  const getDashboardRoute = useCallback(() => {
    return user ? (ROLE_ROUTES[user.role] || '/login') : '/login';
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
