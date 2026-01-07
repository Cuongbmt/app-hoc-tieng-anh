
import React, { useState, useEffect, useRef } from 'react';
import { generateSkillExercise, evaluateAdvancedWriting, textToSpeech, decodePCM, decodeAudioData } from '../services/geminiService';
import { SkillExercise, WritingEvaluation } from '../types';

const SkillsLab: React.FC = () => {
  const [activeSkill, setActiveSkill] = useState<'listening' | 'reading' | 'speaking' | 'writing'>('listening');
  const [level, setLevel] = useState('Intermediate');
  const [topic, setTopic] = useState('Daily Life');
  const [exercise, setExercise] = useState<SkillExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [writingInput, setWritingInput] = useState('');
  const [writingEval, setWritingEval] = useState<WritingEvaluation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const loadExercise = async () => {
    if (activeSkill === 'writing' || activeSkill === 'speaking') return;
    setLoading(true);
    setShowResults(false);
    setAnswers({});
    try {
      const data = await generateSkillExercise(activeSkill as any, level, topic);
      setExercise(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleWritingSubmit = async () => {
    setLoading(true);
    try {
      const result = await evaluateAdvancedWriting(writingInput);
      setWritingEval(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const playAudio = async () => {
    if (!exercise?.audioPrompt || isPlaying) return;
    setIsPlaying(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const base64 = await textToSpeech(exercise.audioPrompt);
      const decoded = decodePCM(base64);
      const buffer = await decodeAudioData(decoded, audioCtxRef.current, 24000, 1);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (e) { setIsPlaying(false); }
  };

  useEffect(() => { loadExercise(); }, [activeSkill, level]);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Skills Lab 🏆</h2>
          <p className="text-slate-500">Hone your core English abilities with AI-driven tasks.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {['listening', 'reading', 'speaking', 'writing'].map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill as any)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${activeSkill === skill ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {skill}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Configuration</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topic</label>
                <input 
                  type="text" value={topic} onChange={e => setTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Difficulty</label>
                <select 
                  value={level} onChange={e => setLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <button onClick={loadExercise} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                Regenerate Task
              </button>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl">
             <i className="fas fa-lightbulb text-amber-300 text-2xl mb-4"></i>
             <h4 className="font-bold mb-2">Learning Tip</h4>
             <p className="text-xs text-indigo-100 leading-relaxed italic">
               {activeSkill === 'listening' ? "Listen once for the general idea, then once more for specific details." : 
                activeSkill === 'writing' ? "Focus on clarity before complexity. AI will help with the nuance." :
                "Consistency is better than intensity. Practice 15 mins daily."}
             </p>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
               <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
               <p className="text-slate-400 text-sm font-bold">AI is preparing your lesson...</p>
            </div>
          ) : activeSkill === 'writing' ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Writing Specialist</h3>
                <p className="text-slate-500 text-sm mb-4">Write an essay or paragraph about <b>{topic}</b> ({level} level).</p>
                <textarea 
                  value={writingInput} onChange={e => setWritingInput(e.target.value)}
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg leading-relaxed mb-6"
                  placeholder="Start writing here..."
                />
                <button onClick={handleWritingSubmit} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                   Submit for AI Review
                </button>
              </div>

              {writingEval && (
                <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl animate-fadeIn">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Review Report</h4>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-400">SCORE:</span>
                       <span className={`text-2xl font-black ${writingEval.score > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{writingEval.score}/100</span>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h5 className="font-bold text-slate-800 mb-2">AI Feedback:</h5>
                    <p className="text-slate-600 italic">"{writingEval.feedback}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-rose-500 mb-4 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i> Grammar Fixes
                      </h5>
                      <div className="space-y-3">
                        {writingEval.grammarErrors.map((err, i) => (
                          <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-sm line-through text-rose-400">{err.original}</p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{err.corrected}</p>
                            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{err.rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-indigo-500 mb-4 flex items-center gap-2">
                        <i className="fas fa-magic"></i> Style Upgrades
                      </h5>
                      <div className="space-y-3">
                        {writingEval.styleSuggestions.map((sug, i) => (
                          <div key={i} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700 text-sm italic">
                            {sug}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : exercise ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                 <div className="flex justify-between items-start mb-8">
                   <h3 className="text-2xl font-black text-slate-800 leading-tight">{exercise.title}</h3>
                   {activeSkill === 'listening' && (
                     <button 
                       onClick={playAudio}
                       className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                     >
                       <i className={`fas ${isPlaying ? 'fa-volume-up' : 'fa-play ml-1'}`}></i>
                     </button>
                   )}
                 </div>

                 <div className="prose max-w-none text-slate-700 mb-10 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   {exercise.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                 </div>

                 <div className="space-y-8">
                   <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs border-b border-slate-50 pb-2">Comprehension Quiz</h4>
                   {exercise.questions.map((q, qIdx) => (
                     <div key={qIdx} className="space-y-4">
                       <p className="font-bold text-slate-800">{qIdx + 1}. {q.question}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {q.options.map((opt, oIdx) => (
                           <button 
                             key={oIdx}
                             onClick={() => setAnswers({...answers, [qIdx]: oIdx})}
                             className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${answers[qIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-50 hover:border-slate-200'}`}
                           >
                             <span className="w-6 h-6 inline-flex items-center justify-center bg-slate-100 rounded-full mr-3 text-[10px] font-bold">{String.fromCharCode(65 + oIdx)}</span>
                             {opt}
                           </button>
                         ))}
                       </div>
                       {showResults && (
                         <div className={`p-4 rounded-xl text-xs flex gap-3 ${answers[qIdx] === q.correctAnswer ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                           <i className={`fas ${answers[qIdx] === q.correctAnswer ? 'fa-check-circle' : 'fa-times-circle'} mt-1`}></i>
                           <div>
                             <p className="font-bold">{answers[qIdx] === q.correctAnswer ? 'Correct!' : 'Incorrect'}</p>
                             <p className="mt-1 opacity-80">{q.explanation}</p>
                           </div>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>

                 <div className="mt-10 pt-8 border-t border-slate-100">
                    {!showResults ? (
                      <button 
                        onClick={() => setShowResults(true)}
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                      >
                        Check Answers
                      </button>
                    ) : (
                      <button 
                        onClick={loadExercise}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                      >
                        Next Exercise
                      </button>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
               <i className="fas fa-magic text-4xl text-indigo-500 mb-4"></i>
               <h3 className="text-xl font-bold">Select a skill to start</h3>
               <p className="text-slate-400">Choose Listening or Reading to generate questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsLab;
