
import React, { useState, useEffect } from 'react';
import { generateVocabularyByTopic } from '../services/geminiService';
import { VocabularyFolder, VocabularyWord } from '../types';

const PREDEFINED_TOPICS = [
  { name: 'Travel', icon: 'fa-plane', level: 'Basic' },
  { name: 'Food & Cooking', icon: 'fa-utensils', level: 'Basic' },
  { name: 'Technology', icon: 'fa-laptop-code', level: 'Intermediate' },
  { name: 'Business', icon: 'fa-briefcase', level: 'Advanced' },
  { name: 'Sports', icon: 'fa-basketball-ball', level: 'Basic' },
  { name: 'Health', icon: 'fa-heartbeat', level: 'Intermediate' },
  { name: 'Education', icon: 'fa-university', level: 'Intermediate' },
  { name: 'Arts', icon: 'fa-palette', level: 'Intermediate' },
  { name: 'Environment', icon: 'fa-leaf', level: 'Advanced' }
];

const WordFlashcard = ({ word, onFinished }: { word: VocabularyWord, onFinished: (masteryGain: number) => void }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative w-full max-w-md mx-auto h-[400px] perspective-1000 cursor-pointer" onClick={() => setFlipped(!flipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute inset-0 bg-white border border-slate-100 rounded-[40px] shadow-xl flex flex-col items-center justify-center p-10 backface-hidden">
          <span className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-4">{word.level}</span>
          <h3 className="text-5xl font-black text-slate-800 mb-2">{word.word}</h3>
          <p className="text-slate-400 font-mono text-lg">{word.phonetic}</p>
          <p className="absolute bottom-10 text-slate-300 text-xs font-bold uppercase">Click to flip</p>
        </div>
        {/* Back */}
        <div className="absolute inset-0 bg-indigo-600 rounded-[40px] shadow-xl flex flex-col items-center justify-center p-10 rotate-y-180 backface-hidden text-center text-white">
          <h4 className="text-2xl font-bold mb-4">{word.meaning}</h4>
          <p className="text-indigo-100 italic mb-8 leading-relaxed">"{word.example}"</p>
          <div className="flex gap-4 w-full" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => onFinished(0)} className="flex-1 bg-white/20 hover:bg-rose-500 py-3 rounded-2xl font-bold text-sm transition-all">Again</button>
             <button onClick={() => onFinished(10)} className="flex-1 bg-white/20 hover:bg-amber-500 py-3 rounded-2xl font-bold text-sm transition-all">Hard</button>
             <button onClick={() => onFinished(25)} className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl font-bold text-sm transition-all">Good</button>
          </div>
        </div>
      </div>
      <style>{`.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
    </div>
  );
};

const VocabularyRoom: React.FC = () => {
  const [view, setView] = useState<'folders' | 'browse' | 'ai' | 'practice'>('folders');
  const [folders, setFolders] = useState<VocabularyFolder[]>([
    { id: '1', name: 'Essential Travel', icon: 'fa-plane', wordCount: 12, words: [] },
    { id: '2', name: 'Tech Talk', icon: 'fa-code', wordCount: 8, words: [] }
  ]);
  const [activeFolder, setActiveFolder] = useState<VocabularyFolder | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [trainingQueue, setTrainingQueue] = useState<VocabularyWord[]>([]);
  const [trainingIndex, setTrainingIndex] = useState(0);

  const startTraining = (folder: VocabularyFolder) => {
    // In a real app, fetch words from folder
    const mockWords: VocabularyWord[] = [
      { id: '1', word: 'Resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'Kiên cường', example: 'She is a resilient girl.', level: 'Advanced', mastery: 0, nextReview: Date.now() },
      { id: '2', word: 'Inevitably', phonetic: '/ɪˈnev.ɪ.tə.bli/', meaning: 'Chắc chắn xảy ra', example: 'Inevitably, the sun rises.', level: 'B2', mastery: 0, nextReview: Date.now() }
    ];
    setTrainingQueue(mockWords);
    setTrainingIndex(0);
    setView('practice');
  };

  const handleAiGenerate = async () => {
    if (!aiInput) return;
    setLoading(true);
    try {
      const newWords = await generateVocabularyByTopic(aiInput, 'Intermediate');
      const newFolder: VocabularyFolder = {
        id: Math.random().toString(),
        name: aiInput,
        icon: 'fa-robot',
        wordCount: newWords.length,
        words: newWords
      };
      setFolders([newFolder, ...folders]);
      setAiInput('');
      setView('folders');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Word Vault 🏦</h2>
          <p className="text-slate-500">Master vocabulary with AI Spaced Repetition (SRS).</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <button onClick={() => setView('folders')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'folders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500'}`}>My Folders</button>
          <button onClick={() => setView('browse')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'browse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500'}`}>Browse Topics</button>
          <button onClick={() => setView('ai')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500'}`}>AI Creator</button>
        </div>
      </header>

      {view === 'folders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button onClick={() => setView('ai')} className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-slate-200 transition-all text-slate-400 group">
             <i className="fas fa-plus text-2xl group-hover:scale-125 transition-transform"></i>
             <span className="font-bold text-sm">Create New Folder</span>
          </button>
          {folders.map(folder => (
            <div key={folder.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
               <div>
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    <i className={`fas ${folder.icon}`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{folder.name}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{folder.wordCount} words</p>
               </div>
               <button onClick={() => startTraining(folder)} className="mt-8 w-full bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all">Study Now</button>
            </div>
          ))}
        </div>
      )}

      {view === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {PREDEFINED_TOPICS.map((topic, i) => (
             <button 
               key={i} 
               onClick={() => { setAiInput(topic.name); setView('ai'); }}
               className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-6 hover:shadow-lg transition-all text-left group"
             >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <i className={`fas ${topic.icon}`}></i>
                </div>
                <div>
                   <h4 className="font-bold text-slate-800">{topic.name}</h4>
                   <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-400 uppercase">{topic.level}</span>
                </div>
             </button>
           ))}
        </div>
      )}

      {view === 'ai' && (
        <div className="max-w-2xl mx-auto py-12">
           <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl text-center">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[30px] flex items-center justify-center text-3xl mx-auto mb-8 shadow-xl shadow-indigo-100">
                <i className="fas fa-magic"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">What do you want to learn?</h3>
              <p className="text-slate-500 mb-8">Type any topic (e.g. "Space Exploration", "Cooking Italian") and AI will curate a perfect word list for you.</p>
              <div className="space-y-4">
                 <input 
                   type="text" value={aiInput} onChange={e => setAiInput(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-6 py-4 text-lg outline-none focus:border-indigo-500 transition-all text-center"
                   placeholder="Enter a topic..."
                 />
                 <button 
                   onClick={handleAiGenerate} disabled={loading || !aiInput}
                   className="w-full bg-indigo-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {loading ? 'Curating Word List...' : 'Generate with AI'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {view === 'practice' && trainingQueue.length > 0 && (
        <div className="max-w-md mx-auto py-10">
           <div className="flex justify-between items-center mb-10">
              <button onClick={() => setView('folders')} className="text-slate-400 font-bold text-sm hover:text-slate-800"><i className="fas fa-arrow-left mr-2"></i> Quit Session</button>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{trainingIndex + 1} / {trainingQueue.length}</span>
           </div>
           
           <WordFlashcard 
             word={trainingQueue[trainingIndex]} 
             onFinished={() => {
               if (trainingIndex < trainingQueue.length - 1) {
                 setTrainingIndex(trainingIndex + 1);
               } else {
                 setView('folders');
                 alert('Session Complete! You are making great progress.');
               }
             }}
           />

           <div className="mt-12">
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                 <span>Session Progress</span>
                 <span>{Math.round(((trainingIndex + 1) / trainingQueue.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((trainingIndex + 1) / trainingQueue.length) * 100}%` }}></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyRoom;
