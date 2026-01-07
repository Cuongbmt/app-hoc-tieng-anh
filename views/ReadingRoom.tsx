
import React, { useState, useEffect } from 'react';
import { generateReadingContent } from '../services/geminiService';
import { ReadingContent } from '../types';

const ReadingRoom: React.FC = () => {
  const [level, setLevel] = useState('B1 Intermediate');
  const [topic, setTopic] = useState('Technology & AI');
  const [content, setContent] = useState<ReadingContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await generateReadingContent(level, topic);
      setContent(data);
      setShowTranslation(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reading World 📖</h2>
          <p className="text-slate-500">Dive into fascinating stories tailored for your level.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Level</span>
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>A1 Beginner</option>
              <option>A2 Elementary</option>
              <option>B1 Intermediate</option>
              <option>B2 Upper Intermediate</option>
              <option>C1 Advanced</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Topic</span>
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Travel, Science..."
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
            onClick={loadContent}
            className="self-end bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
          >
            Apply
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center">
          <div className="w-16 h-16 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-500 text-lg font-medium animate-pulse">Curation your AI reading experience...</p>
        </div>
      ) : content ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <article className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl relative group">
              <div className="absolute top-8 right-8 flex gap-2">
                <button 
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showTranslation ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                  title="Toggle Translation"
                >
                  <i className="fas fa-language"></i>
                </button>
              </div>

              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                {content.difficulty}
              </span>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
                {content.title}
              </h1>
              
              <div 
                className="prose prose-lg max-w-none text-slate-700 leading-relaxed space-y-6"
                onMouseUp={handleTextSelection}
              >
                {content.text.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {showTranslation && (
                <div className="mt-12 p-8 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 animate-fadeIn">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase mb-4">Vietnamese Translation</h4>
                  <p className="text-slate-600 italic leading-relaxed">
                    {content.translation}
                  </p>
                </div>
              )}
            </article>
            
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <i className="fas fa-vial text-indigo-500"></i> Comprehension Check
                </h3>
                <p className="text-slate-500 italic">Explain what the main idea of the article was in your own words.</p>
                <textarea className="w-full mt-4 h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Type your summary..."></textarea>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-star text-amber-500"></i> Key Vocabulary
              </h3>
              <div className="space-y-4">
                {content.keywords.map((kw, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 group-hover:text-indigo-600">{kw.word}</span>
                      <span className="text-[10px] font-mono text-slate-400">{kw.phonetic}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium mb-1">{kw.meaning}</p>
                    <p className="text-[11px] text-slate-400 italic">"{kw.example}"</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedText && (
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg animate-slideInRight">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm uppercase">Quick Translate</h4>
                        <button onClick={() => setSelectedText('')}><i className="fas fa-times"></i></button>
                    </div>
                    <p className="text-indigo-100 text-sm italic mb-4">"{selectedText}"</p>
                    <button className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-xs font-bold transition-all">
                        Look up in Dictionary
                    </button>
                </div>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default ReadingRoom;
