
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

const SidebarItem = ({ to, icon, label, active }: { to: string, icon: string, label: string, active: boolean }) => (
  <Link to={to} title={label} className={`flex items-center justify-center md:justify-start gap-3 w-12 h-12 md:w-full md:px-4 md:py-3 rounded-2xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    <i className={`fas ${icon} w-6 text-center text-lg`}></i>
    <span className="hidden md:inline font-bold text-sm tracking-tight">{label}</span>
  </Link>
);

const Navigation = () => {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard';

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-[#0f1115] border-r border-white/5 p-4 md:p-6 flex flex-col gap-2 z-50">
      <div className="flex items-center justify-center md:justify-start gap-3 mb-12 md:px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
          <i className="fas fa-gem"></i>
        </div>
        <h1 className="hidden md:block text-xl font-black text-white tracking-tighter">LingoGem AI</h1>
      </div>
      
      <SidebarItem to="/" icon="fa-th-large" label="Dashboard" active={path === 'dashboard' || path === ''} />
      <SidebarItem to="/skills" icon="fa-brain" label="AI-Powered" active={path === 'skills'} />
      <SidebarItem to="/browser" icon="fa-globe" label="Discovery" active={path === 'browser'} />
      <SidebarItem to="/listening" icon="fa-headphones" label="Listening" active={path === 'listening'} />
      <SidebarItem to="/game" icon="fa-gamepad" label="Vocab Game" active={path === 'game'} />
      <SidebarItem to="/speaking" icon="fa-microphone" label="Speaking" active={path === 'speaking'} />
      <SidebarItem to="/vocabulary" icon="fa-book-open" label="Vocab Smart" active={path === 'vocabulary'} />
      <SidebarItem to="/translation" icon="fa-language" label="Translate" active={path === 'translation'} />
      <SidebarItem to="/youtube" icon="fa-play" label="YouTube" active={path === 'youtube'} />
      <SidebarItem to="/grammar" icon="fa-book" label="Grammar" active={path === 'grammar'} />
      
      <div className="mt-auto hidden md:block p-4 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-[10px] text-slate-500 font-black mb-2 uppercase tracking-widest text-center">Ready to learn?</p>
        <Link to="/exam" className="block text-center bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Mock Exam</Link>
      </div>
    </aside>
  );
};

const App: React.FC = () => {
  const [passiveWords, setPassiveWords] = useState<VocabularyWord[]>([]);
  const [showPassive, setShowPassive] = useState(false);

  useEffect(() => {
    const mock: VocabularyWord[] = [
      { id: '1', word: 'Resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'Kiên cường', example: 'She is a resilient girl.', level: 'Advanced', mastery: 0, nextReview: 0 },
      { id: '2', word: 'Ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'Mơ hồ', example: 'The movie was ambiguous.', level: 'B2', mastery: 0, nextReview: 0 }
    ];
    setPassiveWords(mock);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#0f1115] flex text-white selection:bg-indigo-500/30">
        <Navigation />
        <main className="flex-1 ml-20 md:ml-64 relative">
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
