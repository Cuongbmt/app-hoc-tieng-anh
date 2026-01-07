
export enum LearningModule {
  DASHBOARD = 'dashboard',
  SPEAKING = 'speaking',
  DICTATION = 'dictation',
  READING = 'reading',
  VOCABULARY = 'vocabulary',
  EXAM = 'exam',
  YOUTUBE = 'youtube',
  SKILLS = 'skills',
  TRANSLATION = 'translation',
  CONVERSATION = 'conversation',
  BROWSER = 'browser',
  GRAMMAR = 'grammar',
  GAME = 'game',
  LISTENING = 'listening'
}

export type AIPersonality = 'Friendly' | 'Strict' | 'Creative' | 'Caring' | 'Rude';

export interface VocabGamePair {
  word: string;
  definition: string;
}

export interface ListeningLesson {
  title: string;
  transcript: string;
  summary: string;
  questions: { question: string; options: string[]; correctAnswer: number }[];
}

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  initialMessage: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  level: string;
  summary: string;
  content: string;
  examples: string[];
}

export interface WebArticle {
  url: string;
  title: string;
  excerpt: string;
  content: string;
  source: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  level: string;
  mastery: number; 
  nextReview: number; 
}

export interface SkillExercise {
  title: string;
  content: string;
  audioPrompt?: string;
  questions: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
}

export interface TranslationTask {
  vietnamese: string;
  englishTarget: string;
  context: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  transcript: { start: number; duration: number; text: string; translation: string }[];
}

export interface ShadowingFeedback {
  score: number;
  accuracy: number;
  fluency: number;
  pronunciation: number;
  feedback: string;
  highlightedText: { word: string; status: 'correct' | 'incorrect' | 'missed' }[];
}

export interface ToeicQuestion {
  id: string;
  part: number;
  questionText?: string;
  options: string[];
  correctAnswer: number; 
  explanation: string;
  audioPrompt?: string;
  passage?: string;
  imagePrompt?: string;
}

export interface ReadingContent {
  title: string;
  text: string;
  difficulty: string;
  translation: string;
  keywords: { word: string; phonetic: string; meaning: string; example: string }[];
}

// Fix: Adding missing WritingEvaluation interface used in SkillsLab view
export interface WritingEvaluation {
  score: number;
  feedback: string;
  grammarErrors: {
    original: string;
    corrected: string;
    rule: string;
  }[];
  styleSuggestions: string[];
}

// Fix: Adding missing VocabularyFolder interface used in VocabularyRoom view
export interface VocabularyFolder {
  id: string;
  name: string;
  icon: string;
  wordCount: number;
  words: VocabularyWord[];
}
