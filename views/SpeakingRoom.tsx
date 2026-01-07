

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodePCM, decodePCM, decodeAudioData, getSystemInstruction } from '../services/geminiService';
import { AIPersonality, ConversationScenario } from '../types';

const SCENARIOS: ConversationScenario[] = [
  { id: 'casual', title: 'Casual Chat', description: 'Talk about anything on your mind.', icon: 'fa-comments', initialMessage: 'Hey there! How is your day going?' },
  { id: 'interview', title: 'Job Interview', description: 'Practice professional questions.', icon: 'fa-user-tie', initialMessage: 'Welcome to our company. Can you tell me about yourself?' },
  { id: 'hotel', title: 'Hotel Booking', description: 'Reserve a room for your trip.', icon: 'fa-hotel', initialMessage: 'Grand Plaza Hotel, how can I help you today?' },
  { id: 'coffee', title: 'At the Cafe', description: 'Order your favorite drink.', icon: 'fa-coffee', initialMessage: 'Hi! What can I get for you today?' },
  { id: 'custom', title: 'Custom Topic', description: 'Define your own situation.', icon: 'fa-magic', initialMessage: 'Tell me where we are and what we should talk about!' }
];

const PERSONALITIES: { id: AIPersonality; icon: string; label: string }[] = [
  { id: 'Friendly', icon: 'fa-smile', label: 'Friendly' },
  { id: 'Strict', icon: 'fa-ruler', label: 'Strict' },
  { id: 'Creative', icon: 'fa-paint-brush', label: 'Creative' },
  { id: 'Caring', icon: 'fa-heart', label: 'Caring' },
  { id: 'Rude', icon: 'fa-bolt', label: 'Challenge (Rude)' }
];

const SpeakingRoom: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration State
  const [level, setLevel] = useState('Intermediate');
  const [personality, setPersonality] = useState<AIPersonality>('Friendly');
  const [activeScenario, setActiveScenario] = useState<ConversationScenario>(SCENARIOS[0]);
  const [customScenario, setCustomScenario] = useState('');
  
  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    inputAudioCtxRef.current?.close();
    outputAudioCtxRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsActive(false);
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      // Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = getSystemInstruction(
        personality, 
        level, 
        activeScenario.id === 'custom' ? customScenario : activeScenario.title,
        ['resilient', 'inevitably', 'paradigm'] // Mock current vocab list
      );

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encodePCM(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // Prevent race condition by solely relying on sessionPromise resolves
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const buffer = await decodeAudioData(decodePCM(audioData), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.outputTranscription) {
                setTranscripts(prev => [...prev.slice(-10), `AI: ${message.serverContent?.outputTranscription?.text}`]);
            }
            if (message.serverContent?.inputTranscription) {
                setTranscripts(prev => [...prev.slice(-10), `You: ${message.serverContent?.inputTranscription?.text}`]);
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error. Check API Key and Mic permissions.");
            cleanup();
          },
          onclose: () => cleanup()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: personality === 'Strict' ? 'Puck' : personality === 'Caring' ? 'Kore' : 'Zephyr' } } }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Failed to start session.");
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Sidebar */}
      {!isActive && (
        <aside className="lg:col-span-1 space-y-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-black text-slate-800 mb-6">Setup Session</h3>
             
             <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Your Level</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">AI Personality</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PERSONALITIES.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setPersonality(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${personality === p.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:border-slate-100 text-slate-500'}`}
                      >
                        <i className={`fas ${p.icon} w-6`}></i>
                        <span className="font-bold text-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Scenario</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCENARIOS.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setActiveScenario(s)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${activeScenario.id === s.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:border-slate-100 text-slate-500'}`}
                      >
                        <i className={`fas ${s.icon} text-lg mb-2 block`}></i>
                        <span className="text-xs font-bold">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeScenario.id === 'custom' && (
                   <input 
                     type="text" 
                     placeholder="e.g. Talking to a doctor..." 
                     value={customScenario}
                     onChange={e => setCustomScenario(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm"
                   />
                )}
             </div>
          </div>
        </aside>
      )}

      {/* Main Conversation Window */}
      <div className={`${isActive ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6`}>
        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-xl flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 mb-8 ${isActive ? 'bg-indigo-600 scale-110 shadow-2xl shadow-indigo-200' : 'bg-slate-100'}`}>
            <i className={`fas ${personality === 'Strict' ? 'fa-user-graduate' : personality === 'Rude' ? 'fa-face-angry' : 'fa-microphone'} text-4xl ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-indigo-400/20 rounded-full animate-ping"></div>
                <div className="w-64 h-64 border-2 border-indigo-400/10 rounded-full animate-ping animation-delay-500"></div>
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">
            {isActive ? `${personality} AI is Speaking...` : activeScenario.title}
          </h2>
          <p className="text-slate-500 text-center max-w-sm mb-12">
            {isActive ? `Scenario: ${activeScenario.id === 'custom' ? customScenario : activeScenario.title}` : activeScenario.description}
          </p>

          {error && (
              <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl mb-8 font-bold text-sm border border-rose-100">
                  <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
          )}

          <div className="flex gap-4">
             <button
               onClick={isActive ? cleanup : startSession}
               className={`px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-xl active:scale-95 ${isActive ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
             >
               {isActive ? 'End Conversation' : 'Start Talking'}
             </button>
          </div>

          {/* Transcript overlay when active */}
          {isActive && (
            <div className="mt-12 w-full max-w-2xl bg-slate-50/80 backdrop-blur-md rounded-3xl p-6 h-48 overflow-y-auto border border-slate-100 scroll-smooth">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/80 pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Conversation History</span>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">AI Tutor: {personality}</span>
                </div>
                {transcripts.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-8 animate-pulse">Speak to see transcript...</p>
                ) : (
                    <div className="space-y-4">
                        {transcripts.map((t, i) => (
                            <div key={i} className={`flex ${t.startsWith('You:') ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${t.startsWith('You:') ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                                    {t.split(': ')[1]}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
        
        {!isActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0"><i className="fas fa-brain"></i></div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Vocabulary Integration</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">AI will automatically bring up words from your vault to help you master them in context.</p>
                  </div>
              </div>
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center flex-shrink-0"><i className="fas fa-magic"></i></div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Custom Scenarios</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed mt-1">Don't see a situation you need? Use 'Custom' to describe any real-life encounter.</p>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakingRoom;