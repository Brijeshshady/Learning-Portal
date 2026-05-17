import React, { forwardRef } from 'react';

const CertificateTemplate = forwardRef(({ cert }, ref) => {
  if (!cert) return null;

  return (
    <div
      ref={ref}
      // Fixed size for A4 landscape (1123px x 794px at 96 DPI)
      className="bg-[#09090b] text-white flex flex-col justify-center items-center relative overflow-hidden"
      style={{
        width: '1123px',
        height: '794px',
        fontFamily: "'Inter', sans-serif",
        position: 'absolute', // visually hidden from user flow
        left: '-9999px',
        top: '-9999px',
      }}
    >
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full border-[12px] border-zinc-900 z-10 pointer-events-none"></div>
      <div className="absolute top-4 left-4 w-[calc(100%-32px)] h-[calc(100%-32px)] border-[2px] border-emerald-500/30 z-10 pointer-events-none"></div>
      
      <div className="absolute -top-[300px] -left-[300px] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px]"></div>

      {/* Header */}
      <div className="z-20 text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
        <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">21st Century Skills</h1>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase">Certificate of Completion</h2>
      </div>

      {/* Body */}
      <div className="z-20 text-center max-w-3xl">
        <p className="text-lg font-medium text-zinc-400 mb-6 uppercase tracking-widest">This certifies that</p>
        <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-8 pb-2">
          {cert.studentName || 'Student Name'}
        </p>
        <p className="text-lg font-medium text-zinc-400 mb-6 max-w-2xl mx-auto leading-relaxed">
          Has successfully completed the requirements for the credential and demonstrated exceptional proficiency in
        </p>
        <p className="text-3xl font-bold text-white mb-12">
          {cert.title || 'Course Title'}
        </p>
      </div>

      {/* Footer Signatures */}
      <div className="z-20 w-full max-w-4xl flex justify-between items-end mt-12 px-12">
        <div className="text-center">
          <div className="border-b-2 border-zinc-700 pb-2 mb-2 w-64">
            <p className="text-xl font-['Brush_Script_MT',cursive] text-zinc-300 transform -rotate-2">{cert.issuedBy || 'Instructor'}</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Authorized Instructor</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="w-20 h-20 rounded-full border border-emerald-500/40 flex items-center justify-center text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest">
              Verified<br/>Credential
            </div>
          </div>
          <p className="text-[10px] font-mono text-zinc-500">ID: {cert.id || 'N/A'}</p>
        </div>

        <div className="text-center">
          <div className="border-b-2 border-zinc-700 pb-2 mb-2 w-64">
            <p className="text-lg font-mono text-zinc-300">{cert.date || new Date().toISOString().split('T')[0]}</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Date of Issuance</p>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
