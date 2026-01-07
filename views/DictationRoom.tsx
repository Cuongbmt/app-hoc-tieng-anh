
import React, { useState, useEffect, useRef } from 'react';
import { generateDictationTask, textToSpeech, decodePCM } from '../services/geminiService';

const DictationRoom: React.FC = () => {
  const [level, setLevel] = useState('Intermediate');
  const [task, setTask] = useState<{ sentence: string; hint: string } | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const loadNewTask = async () => {
    setLoading(true);
    setIsCorrect(null);
    setUserInput('');
    setAudioBase64(null);
    try {
      const newTask = await generateDictationTask(level);
      setTask(newTask);
      const audio = await textToSpeech(newTask.sentence);
      setAudioBase64(audio);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (!audioBase64 || isPlaying) return;
    setIsPlaying(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decoded = decodePCM(audioBase64);
      const buffer = await audioCtxRef.current.decodeAudioData(decoded.buffer.slice(0)); // Note: Standard TTS might return mp3 or similar depending on implementation, but our spec says Gemini returns PCM. 
      // Actually, standard Gemini API for text-to-speech with Modality.AUDIO returns raw PCM.
      // So we use our custom decodeAudioData logic from geminiService
      
      // Let's use the robust decoder we wrote in geminiService
      const { decodeAudioData: customDecode } = await import('../services/geminiService');
      const audioBuffer = await customDecode(decoded, audioCtxRef.current, 24000, 1);
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (e) {
      console.error("Audio playback error", e);
      setIsPlaying(false);
    }
  };

  const checkAnswer = () => {
    if (!task) return;
    const cleanUser = userInput.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    const cleanTarget = task.sentence.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    setIsCorrect(cleanUser === cleanTarget);
  };

  useEffect(() => {
    loadNewTask();
    return () => audioCtxRef.current?.close();
  }, [level]);

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dictation Lab</h2>
          <p className="text-slate-500">Sharpen your ears and spelling accuracy.</p>
        </div>
        <select 
          value={level} 
          onChange={(e) => setLevel(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </header>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg mb-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Generating your lesson...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col items-center">
              <button 
                onClick={playAudio}
                disabled={!audioBase64 || isPlaying}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200'}`}
              >
                <i className={`fas ${isPlaying ? 'fa-volume-up text-3xl animate-pulse' : 'fa-play text-2xl ml-1'}`}></i>
              </button>
              <p className="mt-4 text-sm font-bold text-indigo-600 tracking-wider uppercase">Click to Listen</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Type what you hear:</label>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the sentence here..."
                className={`w-full h-32 p-6 rounded-2xl border-2 text-lg outline-none transition-all ${isCorrect === true ? 'border-emerald-500 bg-emerald-50' : isCorrect === false ? 'border-rose-500 bg-rose-50' : 'border-slate-100 focus:border-indigo-500 bg-slate-50'}`}
              />
              
              {isCorrect !== null && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  <i className={`fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'} mt-1`}></i>
                  <div>
                    <p className="font-bold">{isCorrect ? 'Excellent Work!' : 'Not quite right yet.'}</p>
                    <p className="text-sm">Correct Answer: <strong>{task?.sentence}</strong></p>
                    <p className="text-sm mt-1">Hint: <i>{task?.hint}</i></p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={checkAnswer}
                disabled={!userInput}
                className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
              >
                Check Answer
              </button>
              <button 
                onClick={loadNewTask}
                className="px-8 bg-indigo-50 text-indigo-600 font-bold py-4 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
              >
                Next Task
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                <i className="fas fa-lightbulb"></i> Pro Tip
            </h4>
            <p className="text-amber-700 text-sm leading-relaxed">
                Listen at least 3 times before checking the answer. Try to visualize the words as you hear them.
            </p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <h4 className="text-indigo-800 font-bold mb-2 flex items-center gap-2">
                <i className="fas fa-history"></i> Recent History
            </h4>
            <div className="text-indigo-700 text-xs space-y-2">
                <p>• "The quick brown fox..." - 100% Correct</p>
                <p>• "Artificial Intelligence is..." - 85% Correct</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DictationRoom;
