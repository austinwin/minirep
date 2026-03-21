export type ViewMode = 'float' | 'sidebar' | 'panel';
export type AIProvider = 'openai' | 'google' | 'anthropic' | 'grok' | 'deepseek' | 'perplexity';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  viewMode?: 'float' | 'sidebar' | 'panel';
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MemoryHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface MemorySummary {
  userPreferences: string[];
  keyTopics: string[];
  pendingQuestions: string[];
}

export interface MemoryCheckpoint {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  tools: string[];
  summary: MemorySummary;
  facts: string[];
}

export interface MemoryStore {
  version: 1;
  history: MemoryHistoryItem[];
  facts: string[];
  summary: MemorySummary;
  checkpoints: MemoryCheckpoint[];
}

export interface AIContextItem {
  id: string;
  source: 'extractor';
  tab: string;
  title: string;
  content: string;
}
