
import React, { useState, useEffect } from 'react';
import { generateTranslationTask, evaluateTranslation } from '../services/geminiService';
import { TranslationTask } from '../types';

const TranslationRoom: React.FC = () => {
  const [task, setTask] = useState<TranslationTask | null>(null);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<{ score: number; feedback: string; suggestion: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('Intermediate');

  const fetchTask = async () => {
    setLoading(true);
    setResult(null);
    setUserInput('');
    try {
      const data = await generateTranslationTask(level);
      setTask(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const checkTranslation = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const evalData = await evaluateTranslation(userInput, task.englishTarget);
      setResult(evalData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTask(); }, [level]);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Translation Duel ⚔️</h2>
        <p className="text-slate-500 text-lg">Master the art of translating natural Vietnamese thoughts into native English.</p>
      </header>

      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
        
        {loading && !task ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold">Summoning a challenge...</p>
          </div>
        ) : task ? (
          <div className="space-y-10">
            <div className="text-center">
              <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 inline-block">Vietnamese Source</span>
              <h3 className="text-3xl font-bold text-slate-800 leading-tight mb-4">"{task.vietnamese}"</h3>
              <p className="text-slate-400 text-sm italic">Context: {task.context}</p>
            </div>

            <div className="space-y-4">
               <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Your English Translation</label>
               <textarea 
                 value={userInput} onChange={e => setUserInput(e.target.value)}
                 className="w-full h-40 p-8 bg-slate-50 border-2 border-slate-100 rounded-[30px] text-xl text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                 placeholder="How would a native speaker say this?"
               />
            </div>

            {result && (
              <div className="p-8 bg-indigo-600 rounded-[35px] text-white animate-slideInUp shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black uppercase tracking-widest text-xs opacity-70">AI Feedback</h4>
                    <div className="text-3xl font-black">{result.score}/100</div>
                 </div>
                 <p className="text-lg font-medium leading-relaxed mb-6 italic">"{result.feedback}"</p>
                 <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">Native Suggestion</p>
                    <p className="text-white font-bold">{result.suggestion}</p>
                 </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={checkTranslation} disabled={!userInput || loading}
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[25px] text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Submit Translation'}
              </button>
              <button 
                onClick={fetchTask}
                className="px-10 bg-slate-50 text-slate-800 font-bold py-5 rounded-[25px] hover:bg-slate-100 transition-all"
              >
                Skip Task
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-spell-check"></i></div>
            <div>
               <h5 className="font-bold text-slate-800 text-sm">Nuance Check</h5>
               <p className="text-xs text-slate-400">AI evaluates literal vs natural meanings.</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-brain"></i></div>
            <div>
               <h5 className="font-bold text-slate-800 text-sm">Contextual Learning</h5>
               <p className="text-xs text-slate-400">Learn why some words fit better in specific scenes.</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-bolt"></i></div>
            <div>
               <h5 className="font-bold text-slate-800 text-sm">Instant Score</h5>
               <p className="text-xs text-slate-400">Get immediate feedback to correct mental errors.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TranslationRoom;
