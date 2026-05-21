/**
 * Hub Mapping — ES Module for React
 * Maps institutional codes to hub metadata
 */

export const HUB_REGISTRY = {
  'HUB-CH-01': {
    name: 'Skillstech Central Tamil Nadu',
    location: 'Chennai Hub',
    branding: { primary: '#3b82f6', accent: '#a855f7' },
    stats: { totalStudents: 2845, avgCompletion: '78%' },
    coords: { lat: 13.0827, lng: 80.2707 }, // Chennai
  },
  'HUB-CBE-02': {
    name: 'Coimbatore Innovation Lab',
    location: 'Coimbatore West',
    branding: { primary: '#10b981', accent: '#3b82f6' },
    stats: { totalStudents: 1240, avgCompletion: '82%' },
    coords: { lat: 11.0168, lng: 76.9558 }, // Coimbatore
  },
};

export const getHubData = (code) => {
  return HUB_REGISTRY[code] || {
    name: 'Independent Student Hub',
    location: 'Global Region',
    branding: { primary: '#3b82f6', accent: '#a855f7' },
    stats: { totalStudents: 0, avgCompletion: '0%' },
  };
};

export const getCurrentContext = () => {
  const code = localStorage.getItem('schoolCode') || 'GLOBAL';
  return getHubData(code);
};

export const getGlobalMetrics = () => ({
  totalEnrolled: 4085,
  hubsActive: Object.keys(HUB_REGISTRY).length,
  globalAverage: '80%',
});

/** Role → dashboard route mapping */
export const ROLE_ROUTES = {
  'admin':        '/admin',
  'school-admin': '/school-admin',
  'teacher':      '/teacher',
  'student':      '/student',
};

/** All valid roles */
export const VALID_ROLES = Object.keys(ROLE_ROUTES);
