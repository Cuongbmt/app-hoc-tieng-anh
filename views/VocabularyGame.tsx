
import React, { useState, useEffect } from 'react';
import { generateVocabGameData } from '../services/geminiService';
import { VocabGamePair } from '../types';

const VocabularyGame: React.FC = () => {
  const [pairs, setPairs] = useState<VocabGamePair[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  const initGame = async () => {
    setLoading(true);
    setMatches(new Set());
    setScore(0);
    try {
      const data = await generateVocabGameData('General', 'Intermediate');
      setPairs(data);
      setWords([...data.map(p => p.word)].sort(() => Math.random() - 0.5));
      setDefinitions([...data.map(p => p.definition)].sort(() => Math.random() - 0.5));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { initGame(); }, []);

  useEffect(() => {
    if (selectedWord && selectedDef) {
      const correctPair = pairs.find(p => p.word === selectedWord && p.definition === selectedDef);
      if (correctPair) {
        setMatches(prev => new Set(prev).add(selectedWord));
        setScore(prev => prev + 10);
      }
      setSelectedWord(null);
      setSelectedDef(null);
    }
  }, [selectedWord, selectedDef]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
    </div>
  );

  const isComplete = matches.size === pairs.length && pairs.length > 0;

  return (
    <div className="min-h-screen bg-[#0f1115] p-6 md:p-12 text-white flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black mb-2">Vocab Match 🎮</h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Score: {score}</p>
          </div>
          <button onClick={initGame} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl font-bold hover:bg-white/10 transition-all">New Game</button>
        </header>

        {isComplete ? (
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-2xl shadow-orange-500/20">
              <i className="fas fa-trophy"></i>
            </div>
            <h3 className="text-4xl font-black mb-4">Perfect Match!</h3>
            <p className="text-slate-400 mb-10">You've successfully matched all pairs. Great for your memory!</p>
            <button onClick={initGame} className="bg-orange-500 text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-orange-600 active:scale-95 transition-all">Play Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">English Words</h4>
              {words.map(w => (
                <button
                  key={w}
                  disabled={matches.has(w)}
                  onClick={() => setSelectedWord(w)}
                  className={`w-full p-6 rounded-2xl border transition-all text-left font-bold ${matches.has(w) ? 'opacity-0 scale-90 pointer-events-none' : selectedWord === w ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Vietnamese Meanings</h4>
              {definitions.map(d => {
                const isMatched = Array.from(matches).some(w => pairs.find(p => p.word === w && p.definition === d));
                return (
                  <button
                    key={d}
                    disabled={isMatched}
                    onClick={() => setSelectedDef(d)}
                    className={`w-full p-6 rounded-2xl border transition-all text-left text-sm leading-relaxed ${isMatched ? 'opacity-0 scale-90 pointer-events-none' : selectedDef === d ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyGame;
