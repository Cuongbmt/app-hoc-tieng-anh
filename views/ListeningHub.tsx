
import React, { useState, useEffect, useRef } from 'react';
import { generateListeningLesson, textToSpeech, decodePCM, decodeAudioData } from '../services/geminiService';
import { ListeningLesson } from '../types';

const A1_LESSONS = [
  { id: 1, title: "Greetings and Introductions", topic: "Basic greetings, names, and origins" },
  { id: 2, title: "My Family", topic: "Family members and basic descriptions" },
  { id: 3, title: "In My House", topic: "Rooms and common furniture" },
  { id: 4, title: "Numbers and Counting", topic: "Basic numbers 1-100 in context" },
  { id: 5, title: "Telling the Time", topic: "Daily schedules and clock times" },
  { id: 6, title: "Days of the Week", topic: "Weekly routines and habits" },
  { id: 7, title: "My Daily Routine", topic: "Waking up, eating, and sleeping" },
  { id: 8, title: "Colors and Clothes", topic: "Describing what people are wearing" },
  { id: 9, title: "Food and Drinks", topic: "Basic vocabulary for breakfast and lunch" },
  { id: 10, title: "At the Restaurant", topic: "Ordering simple food and drinks" },
  { id: 11, title: "My Pets", topic: "Common household animals" },
  { id: 12, title: "At the Supermarket", topic: "Buying groceries and items" },
  { id: 13, title: "The Weather", topic: "Sunny, rainy, and cold days" },
  { id: 14, title: "My City", topic: "Places in town (park, cinema, bank)" },
  { id: 15, title: "Giving Directions", topic: "Turn left, turn right, go straight" },
  { id: 16, title: "My School Day", topic: "Subjects and classroom objects" },
  { id: 17, title: "Body and Health", topic: "Basic parts of the body and feelings" },
  { id: 18, title: "Hobbies and Interests", topic: "Sports, music, and games" },
  { id: 19, title: "Transportation", topic: "Bus, train, car, and bicycle" },
  { id: 20, title: "On Vacation", topic: "The beach and the mountains" },
];

for (let i = 21; i <= 100; i++) {
  A1_LESSONS.push({
    id: i,
    title: `A1 Practice Lesson #${i}`,
    topic: "General English conversation and vocabulary enrichment."
  });
}

const ListeningHub: React.FC = () => {
  const [view, setView] = useState<'library' | 'lesson'>('library');
  const [selectedLesson, setSelectedLesson] = useState<typeof A1_LESSONS[0] | null>(null);
  const [lessonData, setLessonData] = useState<ListeningLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  
  // Audio Playback State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateProgress = () => {
    if (isPlaying && audioCtxRef.current) {
      const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate + offsetRef.current;
      setCurrentTime(Math.min(elapsed, duration));
      if (elapsed >= duration) {
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameRef.current!);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsPlaying(false);
  };

  const playAudio = async (seekOffset?: number) => {
    if (isPlaying && seekOffset === undefined) {
      offsetRef.current = currentTime;
      stopAudio();
      return;
    }
    
    if (!audioBufferRef.current && audioBase64) {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const decoded = decodePCM(audioBase64);
      audioBufferRef.current = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
      setDuration(audioBufferRef.current.duration);
    }

    if (!audioBufferRef.current || !audioCtxRef.current) return;

    stopAudio();

    const startFrom = seekOffset !== undefined ? seekOffset : offsetRef.current;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioCtxRef.current.destination);
    
    startTimeRef.current = audioCtxRef.current.currentTime;
    offsetRef.current = startFrom;
    
    source.start(0, startFrom);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(e.target.value);
    setCurrentTime(newOffset);
    offsetRef.current = newOffset;
    if (isPlaying) {
      playAudio(newOffset);
    }
  };

  const startLesson = async (lessonInfo: typeof A1_LESSONS[0]) => {
    stopAudio();
    setLoading(true);
    setView('lesson');
    setSelectedLesson(lessonInfo);
    setLessonData(null);
    setAudioBase64(null);
    audioBufferRef.current = null;
    setAnswers({});
    setShowResults(false);
    setCurrentTime(0);
    setDuration(0);
    offsetRef.current = 0;
    
    try {
      const data = await generateListeningLesson(lessonInfo.title + ": " + lessonInfo.topic, "A1 Beginner");
      setLessonData(data);
      const audio = await textToSpeech(data.transcript);
      setAudioBase64(audio);
      
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const decoded = decodePCM(audio);
      audioBufferRef.current = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
      setDuration(audioBufferRef.current.duration);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {view === 'library' ? (
          <div className="animate-fadeIn">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h2 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">A1 Listening Journey 🎧</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Complete 100 lessons to master basic English listening</p>
              </div>
              <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Progress</p>
                    <p className="text-lg font-black text-indigo-400">{completedLessons.size}/100</p>
                 </div>
                 <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${completedLessons.size}%` }}></div>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {A1_LESSONS.map((lesson) => (
                 <button key={lesson.id} onClick={() => startLesson(lesson)} className={`group relative text-left p-6 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 active:scale-95 ${completedLessons.has(lesson.id) ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${completedLessons.has(lesson.id) ? 'bg-emerald-500 text-white' : 'bg-indigo-600/20 text-indigo-400'}`}>{lesson.id}</span>
                       {completedLessons.has(lesson.id) && <i className="fas fa-check-circle text-emerald-500 text-lg"></i>}
                    </div>
                    <h4 className="font-bold text-white mb-2 line-clamp-1">{lesson.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{lesson.topic}</p>
                 </button>
               ))}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn max-w-5xl mx-auto space-y-8">
            <header className="flex items-center gap-6">
               <button onClick={() => { stopAudio(); setView('library'); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><i className="fas fa-arrow-left"></i></button>
               <div>
                  <h3 className="text-2xl font-black">{selectedLesson?.title}</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Level: A1 Beginner • Lesson #{selectedLesson?.id}</p>
               </div>
            </header>

            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[40px] animate-pulse">
                 <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                 <p className="text-slate-400 font-bold">Preparing Audio & Content...</p>
              </div>
            ) : lessonData && (
              <div className="space-y-8">
                 {/* PLAYER SECTION */}
                 <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                       <div className="flex flex-col md:flex-row items-center gap-10">
                          <div className="relative">
                             <button onClick={() => playAudio()} className={`w-28 h-28 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl ${isPlaying ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}>
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-3xl`}></i>
                             </button>
                             {isPlaying && <div className="absolute -inset-2 border-2 border-indigo-400 rounded-full animate-ping opacity-20"></div>}
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                             <h3 className="text-2xl font-black mb-4">{lessonData.title}</h3>
                             <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mb-4">
                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest mr-2">Playback Speed:</span>
                                {[0.75, 1.0, 1.25].map(rate => (
                                  <button 
                                    key={rate} 
                                    onClick={() => { stopAudio(); setPlaybackRate(rate); if(isPlaying) playAudio(currentTime); }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${playbackRate === rate ? 'bg-white text-indigo-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                  >
                                    {rate === 0.75 ? '0.75x' : rate === 1.0 ? '1.0x' : '1.25x'}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="hidden md:block">
                             <button onClick={() => { setCurrentTime(0); offsetRef.current = 0; playAudio(0); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all"><i className="fas fa-redo-alt text-indigo-300"></i></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Restart</span>
                             </button>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <input 
                            type="range" 
                            min="0" 
                            max={duration || 0} 
                            step="0.01"
                            value={currentTime} 
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                          />
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300/60">
                             <span>{formatTime(currentTime)}</span>
                             <span>{formatTime(duration)}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* HORIZONTAL TRANSCRIPT SECTION - MOVED BELOW AUDIO */}
                 <div className="bg-[#1a1c22] border border-white/5 p-10 rounded-[40px] shadow-lg animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                          <i className="fas fa-closed-captioning"></i> Transcript (Lời thoại)
                       </h4>
                       <button onClick={() => playAudio()} className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                          <i className="fas fa-volume-up"></i>
                       </button>
                    </div>
                    <div className="text-white text-xl md:text-2xl leading-relaxed font-medium italic opacity-90 select-text">
                       {lessonData.transcript}
                    </div>
                 </div>

                 {/* BOTTOM GRID: QUIZ AND SUMMARY */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                       <div className="bg-white/5 border border-white/10 p-10 rounded-[40px]">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Comprehension Quiz</h4>
                          <div className="space-y-10">
                             {lessonData.questions.map((q, idx) => (
                               <div key={idx} className="space-y-4">
                                  <p className="font-bold text-xl">{idx + 1}. {q.question}</p>
                                  <div className="grid grid-cols-1 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                      <button key={oIdx} onClick={() => setAnswers({...answers, [idx]: oIdx})} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${answers[idx] === oIdx ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                                        <span className="w-8 h-8 rounded-lg bg-white/5 inline-flex items-center justify-center mr-4 text-xs font-bold">{String.fromCharCode(65 + oIdx)}</span>
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                  {showResults && (
                                    <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${answers[idx] === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                       <i className={`fas ${answers[idx] === q.correctAnswer ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                       {answers[idx] === q.correctAnswer ? 'Correct!' : `Answer: ${q.options[q.correctAnswer]}`}
                                    </div>
                                  )}
                               </div>
                             ))}
                          </div>
                          <div className="mt-12 flex gap-4">
                            {!showResults ? (
                              <button onClick={() => setShowResults(true)} disabled={Object.keys(answers).length < lessonData.questions.length} className="flex-1 bg-indigo-600 py-5 rounded-2xl font-black text-lg disabled:opacity-30 transition-all hover:bg-indigo-700">Check Answers</button>
                            ) : (
                              <>
                                <button onClick={() => { setCurrentTime(0); offsetRef.current = 0; playAudio(0); }} className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all"><i className="fas fa-redo mr-2"></i> Listen Again</button>
                                <button onClick={() => { stopAudio(); setCompletedLessons(prev => new Set(prev).add(selectedLesson!.id)); setView('library'); }} className="flex-1 bg-emerald-600 py-5 rounded-2xl font-black text-lg transition-all hover:bg-emerald-700">Finish Lesson</button>
                              </>
                            )}
                          </div>
                       </div>
                    </div>

                    <aside className="space-y-6">
                       <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Summary (VI)</h4>
                          <p className="text-slate-400 text-sm leading-relaxed italic">"{lessonData.summary}"</p>
                       </div>
                       <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[40px]">
                          <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Learning Tip</h4>
                          <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                             Try reading the transcript horizontal box above while listening to improve your word-sound recognition!
                          </p>
                       </div>
                    </aside>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          border: 3px solid #1e1b4b;
        }
      `}</style>
    </div>
  );
};

export default ListeningHub;
