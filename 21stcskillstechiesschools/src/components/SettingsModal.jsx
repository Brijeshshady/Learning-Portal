import React, { useState } from 'react';
import { User, Bell, Shield, LogOut, Moon, Sun, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import useStore from '../hooks/useStore';
import { addNotification } from '../lib/store';

const SettingsModal = ({ isOpen, onClose, user }) => {
  const { logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  
  const [notifPrefs, setNotifPrefs] = useState({ email_updates: true, push_alerts: true, grade_notifs: true, marketing: false });
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');

  // Update local state when user prop changes
  React.useEffect(() => {
    if (user) setProfileData({ name: user.name, email: user.email });
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (activeTab === 'profile') {
        updateProfile(profileData);
      } else if (activeTab === 'security') {
        if (!passData.current || !passData.new || !passData.confirm) {
          setPassError('Please fill out all password fields.');
          setLoading(false);
          return;
        }
        if (passData.new !== passData.confirm) {
          setPassError('New passwords do not match.');
          setLoading(false);
          return;
        }
        if (passData.new.length < 6) {
          setPassError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        setPassData({ current: '', new: '', confirm: '' });
        setPassError('');
      }
      setLoading(false);
      addNotification({
        title: 'Settings Saved',
        body: 'Your preferences have been updated successfully.',
        type: 'success'
      });
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Platform Settings">
      <div className="flex gap-6 min-h-[400px]">
        {/* Sidebar */}
        <div className="w-48 shrink-0 flex flex-col gap-1 border-r border-zinc-800 pr-6">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'security', icon: Shield, label: 'Security' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          
          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all mt-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h4 className="text-base font-black text-white mb-4">Profile Information</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl font-black text-white shrink-0 border border-zinc-700">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-lg mb-1">Upload Photo</button>
                  <p className="text-xs text-zinc-500">JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Full Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Email Address</label>
                  <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Role</label>
                  <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-400 uppercase tracking-widest font-black text-[10px]">
                    {user?.role || 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end">
                <button type="submit" disabled={loading} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Preferences tab removed as we only support Dark mode */}

          {activeTab === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h4 className="text-base font-black text-white mb-4">Notification Settings</h4>
              
              <div className="space-y-4">
                {[
                  { id: 'email_updates', label: 'Email Updates', desc: 'Receive daily summary emails' },
                  { id: 'push_alerts', label: 'Push Alerts', desc: 'Important platform alerts' },
                  { id: 'grade_notifs', label: 'Grade Notifications', desc: 'When new grades are posted' },
                  { id: 'marketing', label: 'Marketing', desc: 'News and promotional content' }
                ].map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={notifPrefs[item.id]} onChange={(e) => setNotifPrefs({...notifPrefs, [item.id]: e.target.checked})} className="sr-only peer" />
                      <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end">
                <button type="submit" disabled={loading} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h4 className="text-base font-black text-white mb-4">Security Settings</h4>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Current Password</label>
                <input type="password" value={passData.current} onChange={(e) => { setPassData({...passData, current: e.target.value}); setPassError(''); }} placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">New Password</label>
                <input type="password" value={passData.new} onChange={(e) => { setPassData({...passData, new: e.target.value}); setPassError(''); }} placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Confirm New Password</label>
                <input type="password" value={passData.confirm} onChange={(e) => { setPassData({...passData, confirm: e.target.value}); setPassError(''); }} placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
              </div>
              
              {passError && <p className="text-red-400 text-xs font-bold mt-2">{passError}</p>}

              <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end">
                <button type="submit" disabled={loading} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
