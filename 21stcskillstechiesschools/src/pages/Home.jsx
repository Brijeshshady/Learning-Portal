import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Code, Cpu, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-48 pb-24 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: AI-Powered Learning 2024
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-headline mb-8 leading-[1.1] tracking-tighter">
                Master the <span className="text-primary italic">Skills</span> of the Future.
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed font-medium">
                Transform your education with hands-on Robotics, AI, and Programming curriculum designed for the next generation of innovators.
              </p>
              <div className="flex flex-col sm:row gap-4">
                <Link to="/register" className="bg-primary text-white font-black py-4 px-8 rounded-2xl hover:bg-blue-600 transition-all text-center shadow-xl shadow-primary/25 uppercase tracking-widest text-xs">
                  Start Learning Now
                </Link>
                <a href="#programs" className="glass-card py-4 px-8 rounded-2xl font-black text-center border-white/5 hover:border-white/10 transition-all uppercase tracking-widest text-xs">
                  View Programs
                </a>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full"></div>
              <div className="glass-card p-2 rounded-[2.5rem] relative z-10 overflow-hidden group">
                <img src="/hero-dashboard.png" alt="AI Learning Dashboard" className="w-full h-auto rounded-[2rem] shadow-2xl transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-6 -right-6 glass-card p-6 rounded-3xl shadow-2xl z-20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="text-secondary w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black font-headline text-white">98%</div>
                    <div className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-black">Success Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Programs */}
        <section className="py-32 px-6 border-t border-white/5" id="programs">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-black font-headline mb-6 tracking-tighter">What Students <span className="text-primary italic">Build.</span></h2>
              <p className="text-zinc-500 text-xl font-medium max-w-2xl mx-auto">Hands-on projects that define the future of technology.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Programming Card */}
              <div className="col-span-12 lg:col-span-8 glass-card overflow-hidden group min-h-[450px] rounded-[3rem]">
                <div className="grid md:grid-cols-2 h-full">
                  <div className="p-12 flex flex-col justify-center order-2 md:order-1">
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-8">
                      <Code className="text-primary w-7 h-7" />
                    </div>
                    <h3 className="text-4xl font-black font-headline mb-4">Advanced Programming</h3>
                    <p className="text-zinc-400 leading-relaxed mb-10 font-medium">
                      From Python basics to full-stack application development. Students learn logic, data structures, and how to build scalable software.
                    </p>
                    <Link to="/contact" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:gap-4 transition-all">
                      Explore Curriculum <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="relative order-1 md:order-2 overflow-hidden">
                    <img src="/programming-premium.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Programming" />
                  </div>
                </div>
              </div>

              {/* AI Card */}
              <div className="col-span-12 lg:col-span-4 glass-card overflow-hidden group min-h-[450px] rounded-[3rem] p-12 flex flex-col">
                <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-8">
                  <Cpu className="text-secondary w-7 h-7" />
                </div>
                <h3 className="text-4xl font-black font-headline mb-4">Artificial Intelligence</h3>
                <p className="text-zinc-400 leading-relaxed mb-10 font-medium">
                  Mastering LLMs, Prompt Engineering, and AI-driven creativity.
                </p>
                <div className="mt-auto overflow-hidden rounded-[2rem] h-48">
                  <img src="/ai-premium.png" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="AI" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* India Map Section */}
        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto glass-card p-12 md:p-24 rounded-[4rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] -mr-64 -mt-64 pointer-events-none"></div>
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div>
                <h2 className="text-4xl md:text-6xl font-black font-headline mb-8 tracking-tighter leading-tight">
                  Growing Network in <br/><span className="text-primary italic">Tamil Nadu</span>
                </h2>
                <p className="text-zinc-400 text-xl leading-relaxed mb-12 font-medium">
                  We've successfully integrated industry-grade AI and tech labs in schools from Chennai to Kanyakumari.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  {['Chennai', 'Coimbatore', 'Madurai', 'Trichy'].map((city, idx) => (
                    <div key={city} className="flex items-center gap-4">
                      <span className={`w-3 h-3 rounded-full ${idx < 2 ? 'bg-primary' : 'bg-secondary'}`}></span>
                      <span className="text-lg font-black font-headline uppercase tracking-widest">{city}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <img src="/india.svg" className="w-full max-w-[450px] drop-shadow-[0_0_50px_rgba(59,130,246,0.1)] transition-transform duration-1000 hover:scale-105" alt="Network Map" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-48 px-6 relative overflow-hidden border-t border-white/5 text-center">
          <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full -bottom-1/2"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-8xl font-black font-headline mb-12 tracking-tighter leading-[0.9]">
              Ready to Build <br/>the <span className="text-primary italic">Future?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/contact" className="bg-primary text-white font-black py-6 px-12 rounded-[2rem] hover:bg-blue-600 transition-all text-xl shadow-2xl shadow-primary/40 uppercase tracking-widest text-sm">
                Partner With Us
              </Link>
              <Link to="/about" className="glass-card py-6 px-12 rounded-[2rem] font-black text-xl border-white/5 hover:border-white/10 transition-all uppercase tracking-widest text-sm text-white">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
