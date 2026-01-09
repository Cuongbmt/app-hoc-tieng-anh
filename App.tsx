
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import SpeakingRoom from './views/SpeakingRoom';
import DictationRoom from './views/DictationRoom';
import ReadingRoom from './views/ReadingRoom';
import VocabularyRoom from './views/VocabularyRoom';
import ExamCenter from './views/ExamCenter';
import ToeicSimulator from './views/ToeicSimulator';
import YouTubeStudy from './views/YouTubeStudy';
import SkillsLab from './views/SkillsLab';
import TranslationRoom from './views/TranslationRoom';
import WebDiscovery from './views/WebDiscovery';
import GrammarHub from './views/GrammarHub';
import VocabularyGame from './views/VocabularyGame';
import ListeningHub from './views/ListeningHub';
import PassiveOverlay from './components/PassiveOverlay';
import { VocabularyWord } from './types';

const SidebarItem = ({ to, icon, label, active, onClick }: { to: string, icon: string, label: string, active: boolean, onClick?: () => void }) => (
  <Link 
    to={to} 
    onClick={onClick}
    title={label} 
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    <i className={`fas ${icon} w-6 text-center text-lg`}></i>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </Link>
);

const Navigation = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard';

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <aside className={`fixed left-0 top-0 h-screen bg-[#0f1115] border-r border-white/5 p-6 flex flex-col gap-2 z-[70] transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 w-0 md:w-64 opacity-0 md:opacity-100'}`}>
        
        <div className="flex items-center gap-3 mb-10 px-2 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
            <i className="fas fa-gem"></i>
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter">Tiếng Anh Của Cường</h1>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          <SidebarItem to="/" icon="fa-th-large" label="Bảng điều khiển" active={path === 'dashboard' || path === ''} onClick={onClose} />
          <SidebarItem to="/skills" icon="fa-brain" label="Kỹ năng AI" active={path === 'skills'} onClick={onClose} />
          <SidebarItem to="/browser" icon="fa-globe" label="Khám phá Web" active={path === 'browser'} onClick={onClose} />
          <SidebarItem to="/listening" icon="fa-headphones" label="Luyện nghe" active={path === 'listening'} onClick={onClose} />
          <SidebarItem to="/game" icon="fa-gamepad" label="Game từ vựng" active={path === 'game'} onClick={onClose} />
          <SidebarItem to="/speaking" icon="fa-microphone" label="Luyện nói AI" active={path === 'speaking'} onClick={onClose} />
          <SidebarItem to="/vocabulary" icon="fa-book-open" label="Từ vựng thông minh" active={path === 'vocabulary'} onClick={onClose} />
          <SidebarItem to="/translation" icon="fa-language" label="Dịch thuật AI" active={path === 'translation'} onClick={onClose} />
          <SidebarItem to="/youtube" icon="fa-play" label="Học qua YouTube" active={path === 'youtube'} onClick={onClose} />
          <SidebarItem to="/grammar" icon="fa-book" label="Ngữ pháp" active={path === 'grammar'} onClick={onClose} />
        </nav>
        
        <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5 overflow-hidden whitespace-nowrap">
          <p className="text-[10px] text-slate-500 font-black mb-2 uppercase tracking-widest text-center">Sẵn sàng học chưa?</p>
          <Link to="/exam" onClick={onClose} className="block text-center bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Thi thử & Khảo thí</Link>
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </>
  );
};

const App: React.FC = () => {
  const [passiveWords, setPassiveWords] = useState<VocabularyWord[]>([]);
  const [showPassive, setShowPassive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Mock data for passive learning mode
    const mock: VocabularyWord[] = [
      { id: '1', word: 'Resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'Kiên cường', example: 'She is a resilient girl.', exampleTranslation: 'Cô ấy là một cô gái kiên cường.', level: 'Advanced', mastery: 0, nextReview: 0 },
      { id: '2', word: 'Ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'Mơ hồ', example: 'The movie was ambiguous.', exampleTranslation: 'Bộ phim thật mơ hồ.', level: 'B2', mastery: 0, nextReview: 0 }
    ];
    setPassiveWords(mock);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#0f1115] flex text-white selection:bg-indigo-500/30">
        <Navigation isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        {/* Mobile Toggle Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-6 left-6 z-[80] md:hidden w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-all"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <main className={`flex-1 transition-all duration-300 ${isMobileMenuOpen ? 'md:ml-64' : 'ml-0 md:ml-64'} relative`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/skills" element={<SkillsLab />} />
            <Route path="/browser" element={<WebDiscovery />} />
            <Route path="/grammar" element={<GrammarHub />} />
            <Route path="/translation" element={<TranslationRoom />} />
            <Route path="/youtube" element={<YouTubeStudy />} />
            <Route path="/exam" element={<ExamCenter />} />
            <Route path="/exam/toeic/:mode/:part" element={<ToeicSimulator />} />
            <Route path="/speaking" element={<SpeakingRoom />} />
            <Route path="/dictation" element={<DictationRoom />} />
            <Route path="/reading" element={<ReadingRoom />} />
            <Route path="/vocabulary" element={<VocabularyRoom />} />
            <Route path="/game" element={<VocabularyGame />} />
            <Route path="/listening" element={<ListeningHub />} />
          </Routes>
        </main>
        
        {showPassive && (
          <PassiveOverlay words={passiveWords} interval={20} onClose={() => setShowPassive(false)} />
        )}
      </div>
    </Router>
  );
};

export default App;
