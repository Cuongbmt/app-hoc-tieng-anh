
import React, { useState } from 'react';
import { searchWebArticles } from '../services/geminiService';
import { WebArticle } from '../types';

const WebDiscovery: React.FC = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<WebArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeArticle, setActiveArticle] = useState<WebArticle | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const results = await searchWebArticles(query);
      setArticles(results);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) {
      setSelectedText(sel.toString());
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Web Discovery 🌐</h2>
          <p className="text-slate-500">Learn English through topics you are passionate about.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search topic (e.g. AI News, Travel, Cooking)..."
            className="flex-1 md:w-80 bg-white border border-slate-200 rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold">Find Articles</button>
        </div>
      </header>

      {activeArticle ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
           <div className="lg:col-span-2 bg-white rounded-[40px] p-12 border border-slate-100 shadow-xl overflow-y-auto max-h-[80vh] relative">
              <button onClick={() => setActiveArticle(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800"><i className="fas fa-times text-xl"></i></button>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block">{activeArticle.source}</span>
              <h1 className="text-4xl font-black text-slate-900 mb-8 leading-tight">{activeArticle.title}</h1>
              <div 
                className="prose prose-lg max-w-none text-slate-700 leading-relaxed space-y-6"
                onMouseUp={handleSelection}
              >
                 {activeArticle.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
           </div>

           <aside className="space-y-6">
              {selectedText && (
                <div className="bg-indigo-600 rounded-[35px] p-8 text-white shadow-2xl animate-slideInRight">
                   <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">AI Quick Translate</h4>
                   <p className="text-lg font-bold italic mb-6">"{selectedText}"</p>
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6">
                      <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">Meaning</p>
                      <p className="font-medium">AI is analyzing...</p>
                   </div>
                   <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-bold">Save to Word Vault</button>
                </div>
              )}
              
              <div className="bg-slate-100 p-8 rounded-[40px] border border-slate-200">
                 <h4 className="font-bold text-slate-800 mb-4">Reader Mode Active</h4>
                 <p className="text-xs text-slate-500 leading-relaxed mb-6">We've cleaned this page from ads and distractions so you can focus on learning vocabulary.</p>
                 <div className="space-y-3">
                    <button className="w-full bg-white py-3 rounded-2xl text-sm font-bold border border-slate-200 flex items-center justify-center gap-2"><i className="fas fa-bookmark"></i> Save Article</button>
                    <button className="w-full bg-white py-3 rounded-2xl text-sm font-bold border border-slate-200 flex items-center justify-center gap-2"><i className="fas fa-share-alt"></i> Share to Stats</button>
                 </div>
              </div>
           </aside>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
           <p className="text-slate-400 font-bold">Searching the web and cleaning articles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {articles.map((art, i) => (
             <button 
               key={i} 
               onClick={() => setActiveArticle(art)}
               className="bg-white p-8 rounded-[40px] border border-slate-100 text-left hover:shadow-2xl hover:border-indigo-100 transition-all group"
             >
                <span className="text-[10px] font-black text-indigo-600 mb-4 block uppercase tracking-widest">{art.source}</span>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">{art.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-6">{art.excerpt}</p>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Read Full Clean Article <i className="fas fa-arrow-right text-[10px]"></i></span>
             </button>
           ))}
           {articles.length === 0 && (
             <div className="lg:col-span-3 py-20 text-center text-slate-300">
                <i className="fas fa-search text-6xl mb-6 opacity-20"></i>
                <p className="text-xl font-bold">Search for any topic to start reading news</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default WebDiscovery;
