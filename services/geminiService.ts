
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ReadingContent, ToeicQuestion, YouTubeVideo, ShadowingFeedback, SkillExercise, TranslationTask, VocabularyWord, AIPersonality, GrammarTopic, WebArticle, VocabGamePair, ListeningLesson } from "../types";

export const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates data for a vocabulary matching game.
 */
export async function generateVocabGameData(topic: string, level: string): Promise<VocabGamePair[]> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 6 English vocabulary words and their clear Vietnamese definitions for a matching game. Topic: "${topic}", Level: "${level}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING }
          },
          required: ["word", "definition"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

/**
 * Generates a focused listening lesson.
 */
export async function generateListeningLesson(topic: string, level: string): Promise<ListeningLesson> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create an English listening lesson for level "${level}" about "${topic}". 
    Provide a transcript (approx 150 words), a summary in Vietnamese, and 3 multiple choice questions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          transcript: { type: Type.STRING },
          summary: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

// ... (Existing functions like getGrammarTheory, searchWebArticles, etc. remain the same)
export async function getGrammarTheory(topicName: string): Promise<GrammarTopic> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain "${topicName}" in Vietnamese.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          level: { type: Type.STRING },
          summary: { type: Type.STRING },
          content: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function searchWebArticles(query: string): Promise<WebArticle[]> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find English articles about "${query}".`,
    config: { tools: [{ googleSearch: {} }] },
  });
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const urls = chunks.map(c => c.web?.uri).filter(Boolean);
  return [{
    url: urls[0] || "",
    title: `Web Discovery: ${query}`,
    excerpt: "Grounded content.",
    content: response.text || "",
    source: "Google Search"
  }];
}

export async function textToSpeech(text: string): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}

export function encodePCM(bytes: Uint8Array): string {
  let b = '';
  for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i]);
  return btoa(b);
}

export function decodePCM(base64: string): Uint8Array {
  const s = atob(base64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const d = new Int16Array(data.buffer);
  const count = d.length / numChannels;
  const buf = ctx.createBuffer(numChannels, count, sampleRate);
  for (let ch = 0; ch < numChannels; ch++) {
    const cd = buf.getChannelData(ch);
    for (let i = 0; i < count; i++) cd[i] = d[i * numChannels + ch] / 32768.0;
  }
  return buf;
}

export function getSystemInstruction(p: AIPersonality, l: string, s: string, v: string[]): string {
  return `Tutor level ${l}. Scenario: ${s}. Use words: ${v.join(',')}. Personality: ${p}. Concise responses.`;
}

export async function generateVocabularyByTopic(t: string, l: string) {
  const ai = getGenAI();
  const res = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Vocab for ${t} level ${l}.`,
    config: { responseMimeType: "application/json", 
    responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: {type:Type.STRING}, phonetic: {type:Type.STRING}, meaning: {type:Type.STRING}, example: {type:Type.STRING} } } } }
  });
  return JSON.parse(res.text || "[]");
}

export async function generateToeicQuestions(p: number, c: number) { return []; }
export async function generateReadingContent(l: string, t: string) { return {} as any; }
export async function generateDictationTask(l: string) { return {sentence:"", hint:""}; }
export async function generateYouTubeStudyScript(t: string) { return {id:"", title:"", transcript:[]} as any; }
export async function evaluateShadowing(t: string, a: string) { return {} as any; }
export async function evaluateTranslation(u: string, t: string) { return {score:0, feedback:"", suggestion:""}; }
export async function generateTranslationTask(l: string) { return {vietnamese:"", englishTarget:"", context:""}; }
export async function generateSkillExercise(s: any, l: any, t: any) { return {title:"", content:"", questions:[]} as any; }
export async function evaluateAdvancedWriting(c: string) { return {score:0, feedback:"", grammarErrors:[], styleSuggestions:[]}; }
