import { createApp } from './app.js';
import { config } from './config.js';
import { llmStatus } from './services/llmService.js';

createApp().listen(config.port, () => {
  const s = llmStatus();
  console.log(`[不帶羅盤的風水師·體驗版] 後端啟動 → http://127.0.0.1:${config.port}`);
  console.log(`[LLM] provider=${s.provider}${s.note ? ` (${s.note})` : ''}  ← 設 .env 的 LLM_PROVIDER/LLM_API_KEY 可切換真 AI`);
});
