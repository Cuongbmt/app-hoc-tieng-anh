
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodePCM, decodePCM, decodeAudioData, getSystemInstruction } from '../services/geminiService';
import { AIPersonality, ConversationScenario } from '../types';

const SCENARIOS: ConversationScenario[] = [
  { id: 'casual', title: 'Trò chuyện tự do', description: 'Nói về bất cứ điều gì bạn đang nghĩ.', icon: 'fa-comments', initialMessage: 'Chào bạn! Ngày hôm nay của bạn thế nào?' },
  { id: 'interview', title: 'Phỏng vấn xin việc', description: 'Luyện tập các câu hỏi chuyên nghiệp.', icon: 'fa-user-tie', initialMessage: 'Chào mừng bạn đến với công ty. Bạn có thể giới thiệu về bản thân không?' },
  { id: 'hotel', title: 'Đặt phòng khách sạn', description: 'Luyện tập đặt phòng cho chuyến đi.', icon: 'fa-hotel', initialMessage: 'Khách sạn Grand Plaza xin nghe, tôi có thể giúp gì cho bạn?' },
  { id: 'coffee', title: 'Tại quán cà phê', description: 'Tập gọi đồ uống yêu thích.', icon: 'fa-coffee', initialMessage: 'Chào bạn! Bạn muốn dùng gì hôm nay?' },
  { id: 'custom', title: 'Chủ đề tự chọn', description: 'Tự định nghĩa tình huống của bạn.', icon: 'fa-magic', initialMessage: 'Hãy cho tôi biết chúng ta đang ở đâu và nên nói về điều gì!' }
];

const PERSONALITIES: { id: AIPersonality; icon: string; label: string }[] = [
  { id: 'Friendly', icon: 'fa-smile', label: 'Thân thiện' },
  { id: 'Strict', icon: 'fa-ruler', label: 'Nghiêm túc' },
  { id: 'Creative', icon: 'fa-paint-brush', label: 'Sáng tạo' },
  { id: 'Caring', icon: 'fa-heart', label: 'Chu đáo' },
  { id: 'Rude', icon: 'fa-bolt', label: 'Thử thách (Khó tính)' }
];

const SpeakingRoom: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
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
      try { sessionRef.current.close?.(); } catch (e) {}
      sessionRef.current = null;
    }
    
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(() => {});
    }
    
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioCtxRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = getSystemInstruction(
        personality, 
        level, 
        activeScenario.id === 'custom' ? customScenario : activeScenario.title,
        ['resilient', 'inevitably', 'paradigm']
      );

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            if (!inputAudioCtxRef.current) return;
            const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encodePCM(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                if (session) {
                  try { session.sendRealtimeInput({ media: pcmBlob }); } catch (err) {}
                }
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
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
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.outputTranscription) {
                setTranscripts(prev => [...prev.slice(-10), `AI: ${message.serverContent?.outputTranscription?.text}`]);
            }
            if (message.serverContent?.inputTranscription) {
                setTranscripts(prev => [...prev.slice(-10), `Bạn: ${message.serverContent?.inputTranscription?.text}`]);
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setError("Lỗi kết nối AI. Vui lòng thử lại sau vài giây.");
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
    } catch (err: any) {
      console.error('Start session failed:', err);
      setError(`Không thể bắt đầu: Lỗi mạng hoặc API Key. Hãy kiểm tra lại.`);
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      {!isActive && (
        <aside className="lg:col-span-1 space-y-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-black text-slate-800 mb-6">Thiết lập hội thoại</h3>
             
             <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Trình độ của bạn</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700">
                    <option value="Beginner">Cơ bản (Beginner)</option>
                    <option value="Intermediate">Trung cấp (Intermediate)</option>
                    <option value="Advanced">Nâng cao (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Tính cách AI</label>
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Tình huống</label>
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
                     placeholder="Ví dụ: Đang đi khám bệnh..." 
                     value={customScenario}
                     onChange={e => setCustomScenario(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-700"
                   />
                )}
             </div>
          </div>
        </aside>
      )}

      <div className={`${isActive ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6`}>
        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-xl flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 mb-8 ${isActive ? 'bg-indigo-600 scale-110 shadow-2xl shadow-indigo-200' : 'bg-slate-100'}`}>
            <i className={`fas ${personality === 'Strict' ? 'fa-user-graduate' : personality === 'Rude' ? 'fa-face-angry' : 'fa-microphone'} text-4xl ${isActive ? 'text-white' : 'text-slate-400'}`}></i>
            {(isActive || isConnecting) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-indigo-400/20 rounded-full animate-ping"></div>
                <div className="w-64 h-64 border-2 border-indigo-400/10 rounded-full animate-ping animation-delay-500"></div>
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">
            {isConnecting ? 'Đang kết nối AI...' : isActive ? `AI đang lắng nghe...` : activeScenario.title}
          </h2>
          <p className="text-slate-500 text-center max-w-sm mb-12">
            {isActive ? `Tình huống: ${activeScenario.id === 'custom' ? customScenario : activeScenario.title}` : activeScenario.description}
          </p>

          {error && (
              <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl mb-8 font-bold text-sm border border-rose-100 text-center max-w-md">
                  <i className="fas fa-exclamation-circle mr-2"></i> {error}
                  <div className="mt-2">
                    <button onClick={startSession} className="text-indigo-600 underline hover:text-indigo-800">Thử lại ngay</button>
                  </div>
              </div>
          )}

          <div className="flex gap-4">
             <button
               onClick={isActive ? cleanup : startSession}
               disabled={isConnecting}
               className={`px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isActive ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
             >
               {isActive ? 'Kết thúc hội thoại' : isConnecting ? 'Đang kết nối...' : 'Bắt đầu nói chuyện'}
             </button>
          </div>

          {isActive && (
            <div className="mt-12 w-full max-w-2xl bg-slate-50/80 backdrop-blur-md rounded-3xl p-6 h-48 overflow-y-auto border border-slate-100 scroll-smooth">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/80 pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử hội thoại</span>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">AI Tutor: {personality}</span>
                </div>
                {transcripts.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-8 animate-pulse">Hãy nói gì đó để xem lời thoại...</p>
                ) : (
                    <div className="space-y-4">
                        {transcripts.map((t, i) => (
                            <div key={i} className={`flex ${t.startsWith('Bạn:') ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${t.startsWith('Bạn:') ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                                    {t.includes(': ') ? t.split(': ')[1] : t}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingRoom;
