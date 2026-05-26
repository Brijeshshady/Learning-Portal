import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, School } from 'lucide-react';

const Navbar = () => (
  <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5 py-4">
    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
          <img src="/logo.webp" alt="21stc Techies Schools" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-headline">21stc Techies Schools</span>
      </Link>
      
      <nav className="hidden lg:flex gap-8">
        <Link to="/" className="text-primary font-semibold">Home</Link>
        <Link to="/about" className="text-zinc-400 hover:text-white transition-colors">About</Link>
        <a href="#programs" className="text-zinc-400 hover:text-white transition-colors">Programs</a>
        <a href="#methodology" className="text-zinc-400 hover:text-white transition-colors">Methodology</a>
        <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact</Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link to="/login" className="hidden sm:inline-flex items-center gap-2 text-zinc-300 font-medium hover:text-primary transition-colors">
          <span>Login</span>
        </Link>
        <Link to="/contact" className="bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 text-sm">
          Get Started
        </Link>
        <button className="lg:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  </header>
);

export default Navbar;
