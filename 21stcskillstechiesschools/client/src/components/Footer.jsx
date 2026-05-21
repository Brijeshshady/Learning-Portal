import React from 'react';
import { Link } from 'react-router-dom';
import { School } from 'lucide-react';

const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/5 bg-background relative z-10">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
      <div className="col-span-1 md:col-span-2">
        <Link to="/" className="flex items-center gap-3 no-underline mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center p-2.5">
            <School className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-white font-headline">21stc Skills</span>
        </Link>
        <p className="text-zinc-400 text-lg max-w-sm mb-8 leading-relaxed">
          Empowering schools with the next generation of technology and science curriculum. Built for innovators, by innovators.
        </p>
      </div>
      
      <div>
        <h4 className="text-white font-bold mb-6">Programs</h4>
        <ul className="space-y-4 text-zinc-400 text-sm">
          <li><a href="#programs" className="hover:text-primary transition-colors">Robotics & IoT</a></li>
          <li><a href="#programs" className="hover:text-primary transition-colors">Artificial Intelligence</a></li>
          <li><a href="#programs" className="hover:text-primary transition-colors">Programming</a></li>
        </ul>
      </div>
      
      <div>
        <h4 className="text-white font-bold mb-6">Company</h4>
        <ul className="space-y-4 text-zinc-400 text-sm">
          <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
          <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="text-zinc-600 text-sm">© 2024 21stc Skills Techies Schools. Powered by Green Dwarf Tech</p>
    </div>
  </footer>
);

export default Footer;
