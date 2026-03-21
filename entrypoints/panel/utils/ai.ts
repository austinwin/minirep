import { AISettings } from '../types/ai';

export async function getAIModel(settings: AISettings) {
  const { provider, apiKey, model, baseUrl } = settings;

  if (!apiKey) {
    throw new Error('API Key is required');
  }

  switch (provider) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey, baseURL: baseUrl })(model);
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      return createGoogleGenerativeAI({ apiKey })(model);
    }
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey })(model);
    }
    case 'grok': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ 
        apiKey,
        baseURL: 'https://api.x.ai/v1',
        name: 'grok',
      }).chat(model);
    }
    case 'deepseek': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ 
        apiKey,
        baseURL: 'https://api.deepseek.com/v1',
        name: 'deepseek',
      }).chat(model);
    }
    case 'perplexity': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ 
        apiKey,
        baseURL: 'https://api.perplexity.ai',
        name: 'perplexity',
      }).chat(model);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-chat-latest',
    'gpt-5.2',
    'gpt-5.2-pro',
    'gpt-5.2-chat-latest',
    'gpt-5.1',
    'gpt-5.1-chat-latest',
    'gpt-4.5-preview',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'chatgpt-4o-latest',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'o3',
    'o3-mini',
    'o1',
    'o1-mini',
    'o1-preview'
  ],
  google: [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-pro-exp-02-05',
    'gemini-2.0-flash',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro-latest',
    'gemini-flash-latest',
    'gemini-flash-lite-latest'
  ],
  anthropic: [
    'claude-opus-4-1',
    'claude-opus-4-0',
    'claude-sonnet-4-5',
    'claude-sonnet-4-0',
    'claude-3-7-sonnet-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-latest',
    'claude-3-haiku-20240307'
  ],
  grok: [
    'grok-2-1212',
    'grok-2-vision-1212',
    'grok-beta'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner'
  ],
  perplexity: [
    'sonar-pro',
    'sonar',
    'sonar-reasoning',
    'sonar-reasoning-pro'
  ]
};
