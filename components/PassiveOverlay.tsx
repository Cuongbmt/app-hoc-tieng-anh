
import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../types';

interface Props {
  words: VocabularyWord[];
  interval: number;
  onClose: () => void;
}

const PassiveOverlay: React.FC<Props> = ({ words, interval, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;
    
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 500);
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [words, interval]);

  if (words.length === 0) return null;

  const currentWord = words[currentIndex];

  return (
    <div className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      {isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <i className="fas fa-eye"></i>
        </button>
      ) : (
        <div className="w-72 bg-white/80 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">Passive Mode</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsMinimized(true)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-minus text-xs"></i></button>
              <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><i className="fas fa-times text-xs"></i></button>
            </div>
          </div>
          
          <div className="mb-2">
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">{currentWord.word}</h4>
            <p className="text-xs font-mono text-slate-400">{currentWord.phonetic}</p>
          </div>
          
          <p className="text-sm font-bold text-slate-600 mb-3">{currentWord.meaning}</p>
          
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-[1000ms] ease-linear"
              style={{ width: '100%', transitionDuration: `${interval}s` }}
              key={currentIndex}
            ></div>
          </div>
          
          <p className="mt-3 text-[10px] text-slate-400 italic line-clamp-1">"{currentWord.example}"</p>
        </div>
      )}
    </div>
  );
};

export default PassiveOverlay;
