
import React from 'react';
import { Link } from 'react-router-dom';

const GridItem = ({ to, label, icon, iconColor, bg = "bg-white/5" }: { to: string, label: string, icon: string, iconColor: string, bg?: string }) => (
  <Link 
    to={to} 
    className={`group flex items-center gap-4 p-6 rounded-3xl border border-white/10 ${bg} backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95`}
  >
    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${iconColor} bg-opacity-20 text-xl group-hover:scale-110 transition-transform`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <span className="text-lg font-bold text-white/90 group-hover:text-white transition-colors">{label}</span>
  </Link>
);

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-16 text-center">
          <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-black tracking-widest uppercase mb-6">
            All-in-One English learning platform
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
            LingoGem AI
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Experience the future of language learning with native-level AI interactions and real-time feedback.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <GridItem to="/skills" label="AI-Powered" icon="fa-brain" iconColor="text-purple-400" />
          <GridItem to="/translation" label="Tập dịch với AI" icon="fa-language" iconColor="text-sky-400" />
          
          <GridItem to="/speaking" label="Smart Speaking" icon="fa-microphone" iconColor="text-emerald-400" />
          <GridItem to="/listening" label="Luyện nghe" icon="fa-headphones" iconColor="text-indigo-400" />
          
          <GridItem to="/grammar" label="Ngữ pháp" icon="fa-book" iconColor="text-pink-400" />
          <GridItem to="/youtube" label="YouTube Learning" icon="fa-play" iconColor="text-rose-400" />
          
          <GridItem to="/browser" label="Trình duyệt AI" icon="fa-globe" iconColor="text-blue-400" />
          <GridItem to="/game" label="Game từ vựng" icon="fa-gamepad" iconColor="text-orange-400" />
          
          <GridItem to="/speaking" label="Hội thoại với AI" icon="fa-comments" iconColor="text-violet-400" />
          <GridItem to="/vocabulary" label="Từ vựng thông minh" icon="fa-book-open" iconColor="text-cyan-400" />
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> AI Server Online</div>
              <div className="w-px h-4 bg-white/10"></div>
              <div>v2.5.0-flash</div>
           </div>
           <div className="flex gap-8 font-bold">
              <Link to="/vocabulary" className="hover:text-white transition-colors">My Progress</Link>
              <Link to="/exam" className="hover:text-white transition-colors">Exam Center</Link>
              <Link to="/settings" className="hover:text-white transition-colors">Settings</Link>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
