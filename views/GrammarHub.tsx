
import React, { useState, useEffect } from 'react';
import { getGrammarTheory } from '../services/geminiService';
import { GrammarTopic } from '../types';

const GRAMMAR_CATEGORIES = [
  { name: 'Tenses', topics: ['Present Simple', 'Present Continuous', 'Past Simple', 'Future Simple'] },
  { name: 'Passive Voice', topics: ['Basic Passive', 'Complex Passive'] },
  { name: 'Conditional', topics: ['Type 0 & 1', 'Type 2', 'Type 3', 'Mixed Conditionals'] },
  { name: 'Clauses', topics: ['Relative Clauses', 'Adverbial Clauses'] }
];

const GrammarHub: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [theory, setTheory] = useState<GrammarTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'browse' | 'content'>('browse');

  const loadTopic = async (topic: string) => {
    setLoading(true);
    setView('content');
    setSelectedTopic(topic);
    try {
      const data = await getGrammarTheory(topic);
      setTheory(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Grammar Hub 📚</h2>
        <p className="text-slate-500">Master the building blocks of the English language.</p>
      </header>

      {view === 'browse' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {GRAMMAR_CATEGORIES.map(cat => (
             <div key={cat.name} className="space-y-4">
                <h4 className="font-black text-indigo-600 uppercase tracking-widest text-xs px-2">{cat.name}</h4>
                <div className="space-y-2">
                   {cat.topics.map(topic => (
                     <button 
                       key={topic}
                       onClick={() => loadTopic(topic)}
                       className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all font-bold text-slate-700"
                     >
                        {topic}
                     </button>
                   ))}
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <button onClick={() => setView('browse')} className="text-sm font-bold text-slate-400 hover:text-slate-800 flex items-center gap-2 mb-4">
                 <i className="fas fa-arrow-left"></i> Back to Topics
              </button>

              {loading ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100">
                   <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-400 font-bold">AI is explaining {selectedTopic}...</p>
                </div>
              ) : theory && (
                <article className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl animate-fadeIn">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{theory.level}</span>
                   <h1 className="text-4xl font-black text-slate-900 mb-6">{theory.title}</h1>
                   <p className="text-lg text-slate-600 font-medium mb-10 leading-relaxed italic border-l-4 border-indigo-600 pl-6 bg-slate-50 py-6 rounded-r-2xl">
                     {theory.summary}
                   </p>
                   
                   <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-6 mb-12">
                      {theory.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                   </div>

                   <h4 className="text-xl font-black text-slate-900 mb-6">Practical Examples:</h4>
                   <div className="space-y-4">
                      {theory.examples.map((ex, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                           <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{i+1}</div>
                           <p className="text-slate-800 font-medium">{ex}</p>
                        </div>
                      ))}
                   </div>
                </article>
              )}
           </div>

           <aside className="space-y-6">
              <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-robot"></i></div>
                    <h4 className="font-bold">AI Tutor Chat</h4>
                 </div>
                 <p className="text-slate-400 text-sm mb-6 leading-relaxed">Ask anything about <b>{selectedTopic}</b>. Our AI will guide you with more examples and practice exercises.</p>
                 <div className="bg-white/5 rounded-2xl p-4 h-64 overflow-y-auto mb-4 border border-white/10 text-xs text-slate-300">
                    <p className="mb-2 italic opacity-60">Try asking: "Can you give me 3 more examples using the passive voice in a business context?"</p>
                 </div>
                 <input 
                   type="text"
                   className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 text-sm"
                   placeholder="Type your question..."
                 />
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 text-center">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto mb-4"><i className="fas fa-check-double"></i></div>
                 <h4 className="font-bold text-slate-800 mb-2">Mastery Quiz</h4>
                 <p className="text-slate-400 text-xs mb-6">Test your knowledge with 5 quick questions on this topic.</p>
                 <button className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Start Quiz</button>
              </div>
           </aside>
        </div>
      )}
    </div>
  );
};

export default GrammarHub;
