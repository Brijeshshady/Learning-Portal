import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useStore from '../hooks/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, Share2, Search, PlusCircle, Flame, Star, Clock } from 'lucide-react';
import { addPost } from '../lib/store';

const ROLE_COLOR = {
  admin:         'text-primary',
  'school-admin':'text-emerald-400',
  teacher:       'text-blue-400',
  student:       'text-secondary',
};

const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] p-7 space-y-5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${post.color ? post.color.split(' ')[1] : 'bg-zinc-800'} flex items-center justify-center font-black text-sm ${post.color ? post.color.split(' ')[0] : 'text-white'}`}>{post.avatar}</div>
          <div>
            <p className="text-sm font-bold text-white">{post.author}</p>
            <p className={`text-[9px] font-black uppercase tracking-widest ${ROLE_COLOR[post.role] || 'text-zinc-500'}`}>{post.role.replace('-', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${post.color}`}>{post.tag}</span>
          <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" />{post.time}</span>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed font-medium">{post.body}</p>
      <div className="flex items-center gap-5 pt-2 border-t border-white/5">
        <button onClick={() => setLiked(!liked)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${liked ? 'text-primary' : 'text-zinc-600 hover:text-white'}`}>
          <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} /> {post.likes + (liked ? 1 : 0)}
        </button>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all">
          <MessageSquare className="w-4 h-4" /> {post.comments}
        </button>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all ml-auto">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </motion.div>
  );
};

const Community = () => {
  const { user } = useAuth();
  const { posts } = useStore();
  const [filter, setFilter] = useState('all');
  const [newPost, setNewPost] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const tags = ['all', 'Announcement', 'Discussion', 'Showcase', 'Event'];
  const filtered = filter === 'all' ? posts : posts.filter(p => p.tag === filter);

  const handlePost = () => {
    if (!newPost.trim()) return;
    addPost({
      author: user?.name || 'Anonymous',
      role: user?.role || 'student',
      avatar: (user?.name || 'A')[0],
      body: newPost,
      tag: 'Discussion',
    });
    setNewPost('');
    setShowCompose(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Platform</p>
            <h1 className="text-3xl font-black font-headline tracking-tighter text-white mt-0.5">Community Hub</h1>
          </div>
        </div>
        <button onClick={() => setShowCompose(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
          <PlusCircle className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Compose Box */}
      {showCompose && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] p-6 space-y-4 border border-primary/20">
          <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share something with the community…" rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary transition-all resize-none font-medium" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowCompose(false); setNewPost(''); }} className="glass-card border border-zinc-800 text-zinc-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Cancel</button>
            <button onClick={handlePost} className="bg-primary text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">Post</button>
          </div>
        </motion.div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
          <input type="text" placeholder="Search posts…" className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/50 transition-all" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tags.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'glass-card border border-zinc-800 text-zinc-500 hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Posts This Week', value: '42', icon: Flame, color: 'text-amber-400' },
          { label: 'Active Members',  value: '186', icon: Star,  color: 'text-primary' },
          { label: 'Your Posts',      value: '3',   icon: MessageSquare, color: 'text-secondary' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
            <div>
              <p className="text-xl font-black font-headline text-white">{s.value}</p>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
};

export default Community;
