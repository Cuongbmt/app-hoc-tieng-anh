
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateVocabularyByTopic, textToSpeech, decodePCM, decodeAudioData } from '../services/geminiService';
import { VocabularyWord } from '../types';
import { DAILY_LIFE_WORDS } from '../data/vocabularyData';

const PREDEFINED_TOPICS = [
  { name: 'Daily Life & Routines', icon: 'fa-home', targetCount: 71, known: 0, level: 'Basic' },
  { name: 'Hobbies & Leisure Activities', icon: 'fa-palette', targetCount: 69, known: 0, level: 'Basic' },
  { name: 'Health & Illness', icon: 'fa-face-frown-slight', targetCount: 69, known: 0, level: 'Intermediate' },
  { name: 'Food & Cooking', icon: 'fa-utensils', targetCount: 79, known: 0, level: 'Basic' },
  { name: 'Shopping & Money', icon: 'fa-sack-dollar', targetCount: 59, known: 0, level: 'Intermediate' },
  { name: 'Clothes & Fashion', icon: 'fa-shirt', targetCount: 59, known: 0, level: 'Basic' },
  { name: 'Weather & Environment', icon: 'fa-cloud-sun-rain', targetCount: 60, known: 0, level: 'Intermediate' },
  { name: 'Travel & Holidays', icon: 'fa-plane-departure', targetCount: 69, known: 0, level: 'Intermediate' },
  { name: 'Transport & Directions', icon: 'fa-traffic-light', targetCount: 58, known: 0, level: 'Basic' },
  { name: 'Home & Furniture', icon: 'fa-couch', targetCount: 67, known: 0, level: 'Basic' },
  { name: 'School & Education', icon: 'fa-graduation-cap', targetCount: 68, known: 0, level: 'Intermediate' },
  { name: 'Work & Jobs', icon: 'fa-briefcase', targetCount: 65, known: 0, level: 'Advanced' }
];

const CACHE_KEY_PREFIX = 'vocab_cache_';
const globalAudioCache: Record<string, AudioBuffer> = {};

const WordFlashcard = ({ word, onFinished, audioCtx }: { word: VocabularyWord, onFinished: (isMastered: boolean) => void, audioCtx: AudioContext | null }) => {
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playWordAudio = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying || !audioCtx) return;

    setIsPlaying(true);
    try {
      let buffer = globalAudioCache[word.word];
      if (!buffer) {
        const base64 = await textToSpeech(word.word);
        if (!base64) throw new Error("TTS failed");
        const decoded = decodePCM(base64);
        buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
        globalAudioCache[word.word] = buffer;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  }, [word, isPlaying, audioCtx]);

  useEffect(() => {
    setFlipped(false);
  }, [word]);

  return (
    <div className="relative w-full max-w-md mx-auto h-[550px] perspective-1000 cursor-pointer" onClick={() => setFlipped(!flipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        
        {/* MẶT TRƯỚC */}
        <div className="absolute inset-0 bg-white border border-slate-100 rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-10 backface-hidden">
          <div className="absolute top-8 right-8">
             <button onClick={playWordAudio} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 active:scale-90 shadow-sm'}`}>
                <i className={`fas ${isPlaying ? 'fa-volume-up animate-pulse text-xl' : 'fa-volume-up text-xl'}`}></i>
             </button>
          </div>
          <span className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-6 px-4 py-1 bg-indigo-50 rounded-full">{word.level || 'B1'}</span>
          <h3 className="text-5xl font-black text-slate-800 mb-2 text-center select-none tracking-tight">{word.word}</h3>
          <p className="text-slate-400 font-mono text-xl select-none mb-10">{word.phonetic}</p>
          
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300">
               <i className="fas fa-redo text-[12px]"></i>
            </div>
            <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest">Nhấn để xem nghĩa</p>
          </div>
        </div>

        {/* MẶT SAU */}
        <div className="absolute inset-0 bg-[#1e1b4b] rounded-[40px] shadow-2xl flex flex-col items-center justify-start p-8 rotate-y-180 backface-hidden text-center text-white overflow-hidden">
          <div className="mt-4 mb-2 text-indigo-300 text-[10px] font-black uppercase tracking-widest">Nghĩa tiếng Việt</div>
          <h4 className="text-3xl font-black mb-4">{word.meaning}</h4>
          
          <div className="w-full h-px bg-white/10 mb-6"></div>
          
          <div className="mb-2 text-indigo-300 text-[10px] font-black uppercase tracking-widest">Ví dụ & Phiên âm</div>
          <div className="bg-white/5 rounded-3xl p-6 w-full mb-6 border border-white/5">
            <p className="text-indigo-100 text-lg font-bold mb-2 leading-relaxed">"{word.example}"</p>
            {word.examplePhonetic && (
                <p className="text-indigo-400 font-mono text-xs mb-3 italic tracking-wide">{word.examplePhonetic}</p>
            )}
            <p className="text-indigo-300/80 text-sm italic font-medium">({word.exampleTranslation})</p>
          </div>
          
          <div className="mt-auto grid grid-cols-2 gap-4 w-full" onClick={(e) => e.stopPropagation()}>
             <button 
                onClick={() => onFinished(false)} 
                className="bg-white/10 hover:bg-rose-500/20 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-white/5 flex items-center justify-center gap-2"
             >
                Học lại
             </button>
             <button 
                onClick={() => onFinished(true)} 
                className="bg-white text-indigo-900 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
             >
                Đã thuộc <i className="fas fa-arrow-right text-[10px]"></i>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VocabularyRoom: React.FC = () => {
  const [view, setView] = useState<'folders' | 'wordList' | 'ai' | 'practice' | 'finished'>('folders');
  const [folders, setFolders] = useState<any[]>(PREDEFINED_TOPICS);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [folderWords, setFolderWords] = useState<VocabularyWord[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [trainingQueue, setTrainingQueue] = useState<VocabularyWord[]>([]);
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const prefetchAudioForWords = async (words: VocabularyWord[]) => {
    if (!audioCtxRef.current) return;
    const wordsToFetch = words.filter(w => !globalAudioCache[w.word]);
    for (const word of wordsToFetch) {
      try {
        const base64 = await textToSpeech(word.word);
        if (base64) {
          const decoded = decodePCM(base64);
          const buffer = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
          globalAudioCache[word.word] = buffer;
        }
      } catch (err) {}
    }
  };

  /**
   * Tải từ vựng theo đợt cho đến khi đủ số lượng yêu cầu.
   */
  const fetchWordsToTarget = async (topic: string, level: string, target: number) => {
    setErrorStatus(null);
    // ƯU TIÊN DỮ LIỆU CÓ SẴN (PRESET)
    if (topic === 'Daily Life & Routines') {
      setFolderWords(DAILY_LIFE_WORDS);
      prefetchAudioForWords(DAILY_LIFE_WORDS.slice(0, 10));
      return DAILY_LIFE_WORDS;
    }

    setLoading(true);
    setLoadingProgress(0);
    let collected: VocabularyWord[] = [];
    
    // Kiểm tra cache trước
    const key = `${CACHE_KEY_PREFIX}${topic}_${level}`.toLowerCase().replace(/\s+/g, '_');
    const cached = localStorage.getItem(key);
    if (cached) {
        const words = JSON.parse(cached);
        if (words.length >= target) {
            setFolderWords(words);
            setLoading(false);
            return words;
        }
        collected = words;
        setFolderWords(collected);
    }

    try {
        while (collected.length < target) {
            const batchSize = Math.min(15, target - collected.length);
            const newWords = await generateVocabularyByTopic(topic, level, batchSize);
            
            if (newWords.length === 0) {
              setErrorStatus("AI đang bận (Hết hạn mức). Đang thử lại...");
              // Đợi thêm 3s nếu lỗi
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            }

            setErrorStatus(null);
            // Lọc trùng lặp
            const uniqueNew = newWords.filter(nw => !collected.some(cw => cw.word.toLowerCase() === nw.word.toLowerCase()));
            collected = [...collected, ...uniqueNew];
            
            setFolderWords(collected);
            setLoadingProgress(Math.min(100, Math.round((collected.length / target) * 100)));
            
            // Cập nhật cache sau mỗi đợt
            localStorage.setItem(key, JSON.stringify(collected));
            
            if (uniqueNew.length === 0) break;
            
            // Nghỉ 1s giữa các đợt để tránh spam API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e: any) {
        console.error("Fetch error", e);
        setErrorStatus("Lỗi kết nối AI. Vui lòng thử lại sau.");
    }
    
    setLoading(false);
    return collected;
  };

  const selectFolder = async (folder: any) => {
    setSelectedFolder(folder);
    setView('wordList');
    setMasteredCount(folder.known || 0);
    await fetchWordsToTarget(folder.name, folder.level || 'Intermediate', folder.targetCount || 71);
  };

  const playAudio = async (word: string) => {
    if (playingWord || !audioCtxRef.current) return;
    let buffer = globalAudioCache[word];
    if (buffer) {
      setPlayingWord(word);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setPlayingWord(null);
      source.start();
      return;
    }
    setPlayingWord(word);
    try {
        const base64 = await textToSpeech(word);
        if (base64) {
          const decoded = decodePCM(base64);
          const newBuffer = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
          globalAudioCache[word] = newBuffer;
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = newBuffer;
          source.connect(audioCtxRef.current.destination);
          source.onended = () => setPlayingWord(null);
          source.start();
        } else {
          setPlayingWord(null);
        }
    } catch (e) { setPlayingWord(null); }
  };

  const startTraining = (words: VocabularyWord[]) => {
    setTrainingQueue(words);
    setTrainingIndex(0);
    setView('practice');
    prefetchAudioForWords(words);
  };

  const handleWordFinished = (isMastered: boolean) => {
    if (isMastered) {
      setMasteredCount(prev => prev + 1);
      setFolders(prev => prev.map(f => f.name === selectedFolder.name ? {...f, known: (f.known || 0) + 1} : f));
    }

    if (trainingIndex < trainingQueue.length - 1) {
      setTrainingIndex(prev => prev + 1);
    } else {
      setView('finished');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiInput) return;
    const folder = { name: aiInput, icon: 'fa-magic', targetCount: 71, known: 0, level: 'Intermediate' };
    setFolders([folder, ...folders]);
    setSelectedFolder(folder);
    setView('wordList');
    await fetchWordsToTarget(aiInput, 'Intermediate', 71);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-[#0f1115] min-h-screen text-white">
      {view === 'folders' && (
        <div className="flex-1 animate-fadeIn pb-24">
          <header className="p-6 flex items-center justify-between">
             <h2 className="text-xl font-bold">Thư mục từ vựng</h2>
          </header>
          <div className="px-6 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex gap-6 mb-6">
                    <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20">
                        <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&h=200&fit=crop" alt="IELTS" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold leading-tight mb-2">IELTS Foundation 3.0-3.5</h3>
                        <p className="text-white/60 text-sm font-medium">{folders.length} chủ đề • Lặp lại ngắt quãng</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-300 w-[15%]"></div>
                </div>
            </div>

            <button onClick={() => setView('ai')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4 text-left">
                   <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-xl">
                      <i className="fas fa-magic"></i>
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">Tạo danh sách bằng AI</h4>
                      <p className="text-slate-500 text-xs">Cá nhân hóa việc học của bạn</p>
                   </div>
                </div>
                <i className="fas fa-plus text-slate-600 group-hover:text-indigo-400"></i>
            </button>

            <div className="space-y-3">
               {folders.map((folder, i) => (
                 <button key={i} onClick={() => selectFolder(folder)} className="w-full bg-[#1a1c22] rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4 text-left">
                       <div className="w-12 h-12 bg-white/5 text-slate-400 rounded-xl flex items-center justify-center text-xl">
                          <i className={`fas ${folder.icon}`}></i>
                       </div>
                       <div>
                          <h4 className="font-bold text-sm mb-1">{folder.name}</h4>
                          <p className="text-slate-500 text-xs">{folder.targetCount} từ • <span className="text-emerald-400/70">{folder.known || 0} đã thuộc</span></p>
                       </div>
                    </div>
                    <i className="fas fa-chevron-right text-slate-700 text-xs"></i>
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {view === 'wordList' && (
        <div className="flex-1 animate-fadeIn pb-24 flex flex-col">
            <header className="p-6 flex items-center gap-4 sticky top-0 bg-[#0f1115] z-10 border-b border-white/5">
                <button onClick={() => setView('folders')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="flex-1 text-left">
                    <h2 className="text-xl font-bold">{selectedFolder?.name}</h2>
                    <p className="text-slate-500 text-xs">Thu thập: {folderWords.length} / {selectedFolder?.targetCount} từ vựng</p>
                </div>
            </header>
            
            {loading && folderWords.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold">AI đang soạn bộ {selectedFolder?.targetCount} từ...</p>
                    {errorStatus && <p className="mt-4 text-rose-400 text-sm font-bold animate-pulse">{errorStatus}</p>}
                </div>
            ) : (
                <>
                {loading && (
                    <div className="px-6 py-2 bg-indigo-600/10 border-b border-indigo-500/20 flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-400 uppercase">
                          {errorStatus || `Đang tải thêm từ mới... ${loadingProgress}%`}
                        </span>
                        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${loadingProgress}%` }}></div>
                        </div>
                    </div>
                )}
                <div className="p-6 space-y-3 flex-1 overflow-y-auto">
                    {folderWords.map((w, idx) => (
                        <div key={idx} className="bg-[#1a1c22] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/5 transition-all group cursor-pointer" onClick={() => startTraining([w])}>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{w.word}</h4>
                                    <span className="text-xs font-mono text-slate-500">{w.phonetic}</span>
                                </div>
                                <p className="text-sm text-slate-400">{w.meaning}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); playAudio(w.word); }} className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-400 ${playingWord === w.word ? 'bg-indigo-500/10 text-indigo-400' : ''}`}>
                                <i className={`fas ${playingWord === w.word ? 'fa-volume-up animate-pulse' : 'fa-volume-up'}`}></i>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-6 sticky bottom-0 bg-[#0f1115]/90 backdrop-blur-md border-t border-white/5">
                    <button 
                        disabled={folderWords.length === 0}
                        onClick={() => startTraining(folderWords)} 
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? `Đang tải (${folderWords.length}/${selectedFolder?.targetCount})...` : `Luyện tập bộ ${folderWords.length} từ này`}
                    </button>
                </div>
                </>
            )}
        </div>
      )}

      {view === 'practice' && (
        <div className="flex-1 flex flex-col p-6 animate-fadeIn">
           <header className="flex justify-between items-center mb-12">
              <button onClick={() => setView('wordList')} className="text-slate-400 font-bold flex items-center gap-2">
                 <i className="fas fa-times"></i> Dừng học
              </button>
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-3 py-1 rounded-full">
                 Đã thuộc: {masteredCount} / {selectedFolder?.targetCount || 71}
              </div>
           </header>

           <div className="flex-1 flex flex-col">
             <WordFlashcard 
                word={trainingQueue[trainingIndex]} 
                audioCtx={audioCtxRef.current}
                onFinished={handleWordFinished}
             />
             <div className="mt-auto pt-10">
                <div className="flex justify-between text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">
                    <span>TIẾN ĐỘ CHỦ ĐỀ</span>
                    <span>{Math.round((masteredCount / (selectedFolder?.targetCount || 71)) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(masteredCount / (selectedFolder?.targetCount || 71)) * 100}%` }}></div>
                </div>
             </div>
           </div>
        </div>
      )}

      {view === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fadeIn text-center">
           <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl mb-8 shadow-2xl shadow-emerald-500/20">
              <i className="fas fa-trophy"></i>
           </div>
           <h3 className="text-4xl font-black mb-4">Tuyệt vời!</h3>
           <p className="text-slate-400 text-lg mb-10 max-w-sm">Bạn đã hoàn thành mục tiêu {selectedFolder?.targetCount} từ vựng chủ đề {selectedFolder?.name}.</p>
           <button onClick={() => setView('folders')} className="w-full max-w-xs bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all">Quay lại thư mục</button>
        </div>
      )}

      {view === 'ai' && (
        <div className="flex-1 p-6 animate-fadeIn flex flex-col justify-center items-center">
           <div className="w-20 h-20 bg-indigo-600 text-white rounded-[30px] flex items-center justify-center text-3xl mb-8 shadow-2xl">
              <i className="fas fa-magic"></i>
           </div>
           <h3 className="text-2xl font-black mb-4">Chủ đề bạn muốn học?</h3>
           <div className="w-full max-w-sm space-y-4">
              <input type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg outline-none focus:border-indigo-500 text-center" placeholder="Ví dụ: Tech, IELTS, Job Interview..." />
              <button onClick={() => handleAiGenerate()} disabled={loading || !aiInput} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
                 {loading ? 'AI đang thu thập đủ từ...' : 'Tạo danh sách học'}
              </button>
              <button onClick={() => setView('folders')} className="w-full text-slate-500 font-bold">Quay lại</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyRoom;
