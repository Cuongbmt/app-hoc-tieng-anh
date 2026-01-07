
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateToeicQuestions, textToSpeech, decodePCM, decodeAudioData } from '../services/geminiService';
import { ToeicQuestion } from '../types';

const ToeicSimulator: React.FC = () => {
  const { mode, part } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ToeicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === 'test' ? 7200 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const p = part === 'all' ? 5 : parseInt(part || '5');
        const data = await generateToeicQuestions(p, mode === 'test' ? 10 : 5);
        setQuestions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [part, mode]);

  useEffect(() => {
    if (mode === 'test' && !showResults && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [mode, showResults, timeLeft]);

  const playAudio = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const base64 = await textToSpeech(text);
      const decoded = decodePCM(base64);
      const buffer = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const currentQ = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold animate-pulse">Generating Exam Content...</p>
    </div>
  );

  if (showResults) {
    const score = questions.reduce((acc, q, idx) => acc + (userAnswers[idx] === q.correctAnswer ? 1 : 0), 0);
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl text-center mb-8">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-indigo-100">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h2>
          <p className="text-slate-500 mb-8">You answered {score} out of {questions.length} correctly.</p>
          <button onClick={() => navigate('/exam')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold">Back to Exam Center</button>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className={`p-6 bg-white rounded-2xl border ${userAnswers[idx] === q.correctAnswer ? 'border-emerald-100' : 'border-rose-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Question {idx + 1}</span>
                {userAnswers[idx] === q.correctAnswer ? (
                  <span className="text-emerald-600 text-xs font-bold px-3 py-1 bg-emerald-50 rounded-full">CORRECT</span>
                ) : (
                  <span className="text-rose-600 text-xs font-bold px-3 py-1 bg-rose-50 rounded-full">INCORRECT</span>
                )}
              </div>
              <p className="font-bold text-slate-800 mb-4">{q.questionText || "Listen to the prompt above."}</p>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`text-sm p-3 rounded-xl border ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : oIdx === userAnswers[idx] ? 'bg-rose-50 border-rose-200 text-rose-800' : 'border-slate-50'}`}>
                    {String.fromCharCode(65 + oIdx)}. {opt}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
      <header className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/exam')} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
          <div>
            <h3 className="text-lg font-bold text-slate-800">TOEIC Part {currentQ.part}</h3>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{mode === 'test' ? 'Full Test Mode' : 'Practice Mode'}</p>
          </div>
        </div>
        {mode === 'test' && (
          <div className={`px-6 py-2 rounded-2xl border-2 font-mono font-bold flex items-center gap-3 ${timeLeft < 300 ? 'border-rose-500 text-rose-600 animate-pulse' : 'border-slate-100 text-slate-700'}`}>
            <i className="fas fa-clock"></i>
            {formatTime(timeLeft)}
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
                <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">Question {currentIndex + 1} of {questions.length}</span>
                {currentQ.audioPrompt && (
                    <button 
                        onClick={() => playAudio(currentQ.audioPrompt!)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-100 text-indigo-600 animate-bounce' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                    >
                        <i className={`fas ${isPlaying ? 'fa-volume-up' : 'fa-play ml-1'}`}></i>
                    </button>
                )}
            </div>

            {currentQ.imagePrompt && (
                <div className="w-full h-48 bg-slate-100 rounded-2xl mb-8 flex items-center justify-center border-2 border-dashed border-slate-200">
                    <div className="text-center p-6">
                        <i className="fas fa-image text-4xl text-slate-300 mb-2"></i>
                        <p className="text-xs font-bold text-slate-400 uppercase">[ AI Image Description: {currentQ.imagePrompt} ]</p>
                    </div>
                </div>
            )}

            {currentQ.passage && (
                <div className="p-6 bg-slate-50 rounded-2xl mb-8 text-sm leading-relaxed border border-slate-100 max-h-48 overflow-y-auto">
                    {currentQ.passage}
                </div>
            )}

            <h4 className="text-xl font-bold text-slate-800 mb-8 leading-tight">
                {currentQ.questionText || "Listen to the options and select the best description."}
            </h4>

            <div className="grid grid-cols-1 gap-4">
              {currentQ.options.map((option, idx) => (
                <button 
                  key={idx}
                  onClick={() => setUserAnswers({...userAnswers, [currentIndex]: idx})}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${userAnswers[currentIndex] === idx ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${userAnswers[currentIndex] === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`font-semibold ${userAnswers[currentIndex] === idx ? 'text-indigo-900' : 'text-slate-600'}`}>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2 rounded-xl text-slate-500 font-bold disabled:opacity-30"
            >
                <i className="fas fa-arrow-left mr-2"></i> Back
            </button>
            <div className="flex gap-2">
                {questions.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-indigo-600' : userAnswers[i] !== undefined ? 'bg-indigo-300' : 'bg-slate-200'}`}></div>
                ))}
            </div>
            {currentIndex === questions.length - 1 ? (
                <button 
                    onClick={() => setShowResults(true)}
                    className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                    Finish Test
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 active:scale-95 transition-all"
                >
                    Next <i className="fas fa-arrow-right ml-2"></i>
                </button>
            )}
          </div>
        </div>

        <aside className="w-full md:w-64 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Questions Navigation</h4>
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-full aspect-square rounded-xl text-xs font-bold transition-all ${i === currentIndex ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : userAnswers[i] !== undefined ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                <h4 className="text-indigo-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i> Part {currentQ.part} Guide
                </h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    {currentQ.part <= 4 ? "Listen carefully for key details like who, what, when, and where." : "Focus on grammar consistency and context clues for vocabulary."}
                </p>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default ToeicSimulator;
