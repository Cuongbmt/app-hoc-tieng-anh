
import React, { useState, useEffect, useRef } from 'react';
import { generateYouTubeStudyScript, evaluateShadowing, encodePCM } from '../services/geminiService';
import { YouTubeVideo, ShadowingFeedback } from '../types';

const YouTubeStudy: React.FC = () => {
  const [query, setQuery] = useState('Steve Jobs Stanford Speech');
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'normal' | 'dictation' | 'shadowing'>('normal');
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  
  // Shadowing state
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<ShadowingFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fetchStudyScript = async () => {
    setLoading(true);
    try {
      const data = await generateYouTubeStudyScript(query);
      setVideo(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyScript();
  }, []);

  const startShadowing = async (targetText: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        setEvaluating(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await evaluateShadowing(targetText, base64);
          setFeedback(result);
          setEvaluating(false);
        };
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopShadowing = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">YouTube Learning 🎥</h2>
          <p className="text-slate-500">Study with real-world videos and dual subtitles.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topic or paste link..."
            className="flex-1 md:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={fetchStudyScript} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">
            Search
          </button>
        </div>
      </header>

      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold">Curating study materials...</p>
        </div>
      ) : video ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                <div className="text-center text-white">
                  <i className="fab fa-youtube text-6xl text-rose-500 mb-4"></i>
                  <p className="font-bold text-lg px-8">{video.title}</p>
                </div>
              </div>
              {/* Fake Subtitle Overlay */}
              <div className="absolute bottom-10 left-0 right-0 px-10 text-center pointer-events-none">
                <div className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <p className="text-white font-bold text-lg leading-tight">
                        {video.transcript.find(s => currentTime >= s.start && currentTime < s.start + s.duration)?.text || "Welcome to your study session!"}
                    </p>
                    {showTranslation && (
                        <p className="text-indigo-300 text-sm mt-1 font-medium italic">
                            {video.transcript.find(s => currentTime >= s.start && currentTime < s.start + s.duration)?.translation || "Chào mừng bạn đến với buổi học!"}
                        </p>
                    )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button onClick={() => setMode('normal')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'normal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Normal</button>
                    <button onClick={() => setMode('dictation')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'dictation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Dictation</button>
                    <button onClick={() => setMode('shadowing')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'shadowing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Shadowing</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowTranslation(!showTranslation)} className={`text-sm font-bold ${showTranslation ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <i className="fas fa-language mr-2"></i> Dual Subtitles
                    </button>
                    <button className="text-slate-400 hover:text-indigo-600"><i className="fas fa-bookmark"></i></button>
                </div>
            </div>

            {mode === 'shadowing' && (
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl animate-slideInUp">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <i className="fas fa-microphone-alt"></i> AI Shadowing Lab
                        </h3>
                        {feedback && (
                            <div className="px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
                                Last Score: {feedback.score}/100
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                        <p className="text-lg font-bold leading-relaxed mb-4">
                            {video.transcript.find(s => currentTime >= s.start && currentTime < s.start + s.duration)?.text || "Select a part to shadow"}
                        </p>
                        <div className="flex items-center gap-4">
                            <button 
                                onMouseDown={() => startShadowing(video.transcript.find(s => currentTime >= s.start && currentTime < s.start + s.duration)?.text || "")}
                                onMouseUp={stopShadowing}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white text-indigo-600'}`}
                            >
                                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone text-xl'}`}></i>
                            </button>
                            <div>
                                <p className="font-bold text-sm">Hold to Record</p>
                                <p className="text-xs text-indigo-200">Repeat the sentence after the speaker.</p>
                            </div>
                        </div>
                    </div>

                    {evaluating && (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">AI Evaluating Pronunciation...</p>
                        </div>
                    )}

                    {feedback && !evaluating && (
                        <div className="bg-white rounded-2xl p-6 text-slate-800 animate-fadeIn">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Feedback Result</h4>
                                <div className="flex gap-2">
                                    <div className="text-center px-4 py-1 bg-indigo-50 rounded-lg">
                                        <div className="text-xs text-indigo-400 font-bold">Accuracy</div>
                                        <div className="text-sm font-black text-indigo-600">{feedback.accuracy}%</div>
                                    </div>
                                    <div className="text-center px-4 py-1 bg-indigo-50 rounded-lg">
                                        <div className="text-xs text-indigo-400 font-bold">Fluency</div>
                                        <div className="text-sm font-black text-indigo-600">{feedback.fluency}%</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                {feedback.highlightedText.map((item, idx) => (
                                    <span key={idx} className={`px-2 py-1 rounded-lg text-lg font-bold ${item.status === 'correct' ? 'text-emerald-600' : item.status === 'incorrect' ? 'text-rose-600 underline decoration-rose-300' : 'text-slate-300'}`}>
                                        {item.word}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 italic">
                                "{feedback.feedback}"
                            </p>
                        </div>
                    )}
                </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[600px]">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-list-ul text-indigo-500"></i> Transcript
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {video.transcript.map((seg, i) => (
                    <button 
                        key={i}
                        onClick={() => setCurrentTime(seg.start)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all ${currentTime >= seg.start && currentTime < seg.start + seg.duration ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:bg-slate-50'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono text-slate-400">{Math.floor(seg.start/60)}:{(seg.start%60).toString().padStart(2, '0')}</span>
                            {mode === 'dictation' && (
                                <i className="fas fa-keyboard text-xs text-indigo-300"></i>
                            )}
                        </div>
                        <p className={`text-sm leading-tight ${currentTime >= seg.start && currentTime < seg.start + seg.duration ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                            {mode === 'dictation' && i % 2 === 0 ? "• • • • • • • • • • • •" : seg.text}
                        </p>
                        {showTranslation && (
                            <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1">{seg.translation}</p>
                        )}
                    </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
                <i className="fas fa-lightbulb text-amber-300 text-3xl mb-4"></i>
                <h4 className="font-bold mb-2">Shadowing Tip</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Try to match the speaker's intonation and stress patterns exactly. Focus on the melody of the sentence!</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};

export default YouTubeStudy;
