import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  llm: {
    // provider: mock(零設定) | openai | deepseek | ollama
    provider: (process.env.LLM_PROVIDER || 'mock').toLowerCase(),
    model: process.env.LLM_MODEL || '',
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || '',
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    temperature: Number(process.env.LLM_TEMPERATURE || 0.6),
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 120000),
  },
};

// 各 provider 的預設端點 / 模型
export function llmDefaults(provider) {
  return {
    openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
    ollama: { baseUrl: config.llm.ollamaUrl, model: 'qwen2.5:7b' },
  }[provider] || {};
}

export default config;
