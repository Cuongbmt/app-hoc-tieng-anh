
import { GoogleGenAI, Type, Modality, GenerateContentParameters } from "@google/genai";
import { 
  ReadingContent, 
  ToeicQuestion, 
  YouTubeVideo, 
  ShadowingFeedback, 
  SkillExercise, 
  TranslationTask, 
  VocabularyWord, 
  AIPersonality, 
  GrammarTopic, 
  WebArticle, 
  VocabGamePair, 
  ListeningLesson 
} from "../types";

export const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function callGemini(params: GenerateContentParameters, retries = 3, delay = 2000): Promise<string> {
  const ai = getGenAI();
  try {
    const response = await ai.models.generateContent(params);
    const text = response.text || "";
    if (!text) {
      throw new Error("Empty response from AI");
    }
    return text;
  } catch (error: any) {
    const errorStr = error.toString();
    
    // Specific check for quota exceeded error
    if (errorStr.includes('exceeded quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("API_QUOTA_EXCEEDED: Your Gemini API quota has been exceeded. Please check your usage limits and billing status externally.");
    }

    const isRateLimit = errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.toLowerCase().includes('exhausted');
    const isNetworkError = errorStr.includes('xhr') || errorStr.includes('Network') || errorStr.includes('500');

    if (retries > 0 && (isRateLimit || isNetworkError)) {
      console.warn(`Gemini API Busy/Limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGemini(params, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function generateVocabularyByTopic(t: string, l: string, count: number = 15): Promise<VocabularyWord[]> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate exactly ${count} English vocabulary words for the topic "${t}" at level "${l}". 
      Return strictly a JSON array of objects with keys: word, phonetic, meaning, example, examplePhonetic, exampleTranslation.`,
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              word: {type:Type.STRING}, 
              phonetic: {type:Type.STRING}, 
              meaning: {type:Type.STRING}, 
              example: {type:Type.STRING},
              examplePhonetic: {type:Type.STRING},
              exampleTranslation: {type:Type.STRING}
            },
            required: ["word", "phonetic", "meaning", "example", "exampleTranslation"]
          } 
        } 
      }
    });
    const words = JSON.parse(text || "[]");
    return words.map((w: any, i: number) => ({
      ...w,
      id: `${Date.now()}-${i}`,
      mastery: 0,
      nextReview: 0
    }));
  } catch (e) {
    console.error("Failed to generate vocab", e);
    throw e; // Propagate the error for UI to handle
  }
}

export async function textToSpeech(text: string): Promise<string> {
  const ai = getGenAI();
  for (let retries = 3; retries >= 0; retries--) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e: any) {
      const errorStr = e.toString();
      if (errorStr.includes('exceeded quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("API_QUOTA_EXCEEDED: Your Gemini API quota has been exceeded. Please check your usage limits and billing status externally.");
      }
      const isRateLimit = errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.toLowerCase().includes('exhausted');
      const isNetworkError = errorStr.includes('xhr') || errorStr.includes('Network') || errorStr.includes('500');

      if (retries > 0 && (isRateLimit || isNetworkError)) {
        console.warn(`TTS API Busy/Limited. Retrying in ${(4 - retries) * 2000}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
        continue;
      }
      throw e; // Rethrow after all retries or for other errors
    }
  }
  throw new Error("textToSpeech failed after multiple retries."); // Should ideally not be reached
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

export async function generateToeicQuestions(p: number, c: number): Promise<ToeicQuestion[]> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate ${c} TOEIC Part ${p} questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              part: { type: Type.INTEGER },
              questionText: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("Failed to generate TOEIC questions", e);
    throw e;
  }
}

export async function generateReadingContent(l: string, t: string): Promise<ReadingContent> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Create a reading comprehension task at level "${l}" about "${t}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            text: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            translation: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  word: {type:Type.STRING}, 
                  phonetic: {type:Type.STRING}, 
                  meaning: {type:Type.STRING}, 
                  example: {type:Type.STRING} 
                } 
              } 
            }
          }
        }
      }
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to generate reading content", e);
    throw e;
  }
}

export async function generateDictationTask(l: string) {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate one English sentence at level "${l}" for dictation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            sentence: { type: Type.STRING }, 
            hint: { type: Type.STRING } 
          } 
        }
      }
    });
    return JSON.parse(text || '{"sentence":"","hint":""}');
  } catch (e) {
    console.error("Failed to generate dictation task", e);
    throw e;
  }
}

export async function generateYouTubeStudyScript(t: string): Promise<YouTubeVideo> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate a study script for a YouTube video about "${t}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            transcript: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  start: {type:Type.NUMBER}, 
                  text: {type:Type.STRING}, 
                  translation: {type:Type.STRING} 
                } 
              } 
            }
          }
        }
      }
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to generate YouTube study script", e);
    throw e;
  }
}

export async function evaluateShadowing(t: string, a: string): Promise<ShadowingFeedback> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Evaluate shadowing attempt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            score: {type:Type.NUMBER}, 
            feedback: {type:Type.STRING}, 
            highlightedText: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  word: {type:Type.STRING}, 
                  status: {type:Type.STRING} 
                } 
              } 
            } 
          } 
        } 
      }
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to evaluate shadowing", e);
    throw e;
  }
}

export async function evaluateTranslation(u: string, t: string) {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Evaluate translation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            score: {type:Type.NUMBER}, 
            feedback: {type:Type.STRING}, 
            suggestion: {type:Type.STRING} 
          } 
        }
      }
    });
    return JSON.parse(text || '{"score":0,"feedback":"","suggestion":""}');
  } catch (e) {
    console.error("Failed to evaluate translation", e);
    throw e;
  }
}

export async function generateTranslationTask(l: string) {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate translation task.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            vietnamese: {type:Type.STRING}, 
            englishTarget: {type:Type.STRING}, 
            context: {type:Type.STRING} 
          } 
        }
      }
    });
    return JSON.parse(text || '{"vietnamese":"","englishTarget":"","context":""}');
  } catch (e) {
    console.error("Failed to generate translation task", e);
    throw e;
  }
}

export async function generateSkillExercise(s: string, l: string, t: string): Promise<SkillExercise> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate ${s} exercise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            title: {type:Type.STRING}, 
            content: {type:Type.STRING}, 
            questions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  question: {type:Type.STRING}, 
                  options: {type:Type.ARRAY, items: {type:Type.STRING}}, 
                  correctAnswer: {type:Type.INTEGER}, 
                  explanation: {type:Type.STRING}
                }
              }
            } 
          } 
        } 
      }
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to generate skill exercise", e);
    throw e;
  }
}

export async function evaluateAdvancedWriting(c: string) {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Evaluate writing.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            score: {type:Type.NUMBER}, 
            feedback: {type:Type.STRING}, 
            grammarErrors: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  original: {type:Type.STRING}, 
                  corrected: {type:Type.STRING}, 
                  rule: {type:Type.STRING} 
                } 
              } 
            }, 
            styleSuggestions: { 
              type: Type.ARRAY, 
              items: {type:Type.STRING} 
            } 
          } 
        } 
      }
    });
    return JSON.parse(text || '{"score":0,"feedback":"","grammarErrors":[],"styleSuggestions":[]}');
  } catch (e) {
    console.error("Failed to evaluate advanced writing", e);
    throw e;
  }
}

export async function generateVocabGameData(topic: string, level: string): Promise<VocabGamePair[]> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate vocab game pairs.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              word: {type:Type.STRING}, 
              definition: {type:Type.STRING} 
            } 
          } 
        } 
      } 
    });
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("Failed to generate vocab game data", e);
    throw e;
  }
}

export async function generateListeningLesson(t: string, l: string): Promise<ListeningLesson> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Generate listening lesson.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            title: {type:Type.STRING}, 
            transcript: {type:Type.STRING}, 
            summary: {type:Type.STRING}, 
            questions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  question: {type:Type.STRING}, 
                  options: {type:Type.ARRAY, items: {type:Type.STRING}}, 
                  correctAnswer: {type:Type.INTEGER} 
                } 
              } 
            } 
          } 
        } 
      } 
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to generate listening lesson", e);
    throw e;
  }
}

export async function getGrammarTheory(t: string): Promise<GrammarTopic> {
  try {
    const text = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Explain grammar.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            title: {type:Type.STRING}, 
            level: {type:Type.STRING}, 
            summary: {type:Type.STRING}, 
            content: {type:Type.STRING}, 
            examples: {type:Type.ARRAY, items: {type:Type.STRING}} 
          } 
        } 
      } 
    });
    return JSON.parse(text || "{}");
  } catch (e) {
    console.error("Failed to get grammar theory", e);
    throw e;
  }
}

export async function searchWebArticles(q: string): Promise<WebArticle[]> {
  const ai = getGenAI();
  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview", 
      contents: `Find articles about: ${q}`, 
      config: { tools: [{ googleSearch: {} }] } 
    });
    
    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const results: WebArticle[] = groundingChunks.map((chunk: any, i: number) => ({
      url: chunk.web?.uri || "",
      title: chunk.web?.title || `Article ${i + 1}`,
      excerpt: text.slice(0, 150) + "...",
      content: text,
      source: "Google Search"
    }));

    if (results.length === 0) {
      return [{ url: "", title: "Search Results", excerpt: "", content: text, source: "AI Assistant" }];
    }
    return results;
  } catch (e) {
    console.error("Failed to search web articles", e);
    throw e;
  }
}

export function getSystemInstruction(p: AIPersonality, l: string, s: string, v: string[]): string {
  return `You are an English tutor. Personality: ${p}. Level: ${l}. Scenario: ${s}. Use: ${v.join(',')}.`;
}
