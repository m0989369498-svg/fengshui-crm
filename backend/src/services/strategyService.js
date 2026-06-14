import { extractFeatures } from './metaRouter.js';
import { generateStrategy as llmGenerate, buildMessages } from './llmService.js';
import { saveInteraction } from './store.js';

function safeFeatures(features) { const { raw, ...rest } = features; return rest; }

/** 一次性策略。 */
export async function generateStrategy(customer, { salesQuestion = '', lang = 'zh-Hant' } = {}) {
  const features = extractFeatures(customer);
  const { content, provider, model } = await llmGenerate({ customer, features, salesQuestion, lang });
  await persist(customer, features, salesQuestion, content, model).catch(() => {});
  return { features: safeFeatures(features), strategy: content, provider, model };
}

/** 串流策略。onFeatures 先回特徵，onToken 逐字。 */
export async function generateStrategyStream(customer, { salesQuestion = '', lang = 'zh-Hant' } = {}, { onFeatures, onToken } = {}) {
  const features = extractFeatures(customer);
  if (onFeatures) onFeatures({ features: safeFeatures(features) });
  const { content, provider, model } = await llmGenerate({ customer, features, salesQuestion, lang }, onToken);
  await persist(customer, features, salesQuestion, content, model).catch(() => {});
  return { provider, model };
}

async function persist(customer, features, salesQuestion, strategy, model) {
  await saveInteraction({
    ts: new Date().toISOString(),
    customer: { name: customer.name, phone: customer.phone, dataLevel: features.dataLevel },
    salesQuestion, tags: features.tags, strategy, model,
  });
}

/** 追問（延續脈絡）。 */
export async function followUp({ history = [], userMessage, customerContext = '', lang = 'zh-Hant' }) {
  const langName = lang === 'zh-Hans' ? '简体中文' : '繁體中文';
  const messages = [
    { role: 'system', content: `你是「不帶羅盤的風水師」CRM 策略顧問，用${langName}白話商業語言回答業務員追問，禁術數術語。` },
    ...(customerContext ? [{ role: 'system', content: `顧客脈絡：${customerContext}` }] : []),
    ...history.filter((h) => h && h.role && h.content),
    { role: 'user', content: userMessage },
  ];
  // 追問直接走 LLM（mock 時用簡短規則回覆）
  const { content, provider, model } = await llmGenerateRaw(messages, { userMessage, customerContext });
  return { strategy: content, provider, model };
}

// 讓 followUp 也能在 mock 下運作
import { config, llmDefaults } from '../config.js';
async function llmGenerateRaw(messages, ctx) {
  if (config.llm.provider === 'mock' || ((config.llm.provider === 'openai' || config.llm.provider === 'deepseek') && !config.llm.apiKey)) {
    return { content: mockFollow(ctx.userMessage), provider: 'mock', model: 'builtin' };
  }
  // 真 provider：重用 llmService 的底層（簡化：用 fetch）
  const { provider } = { provider: config.llm.provider };
  const d = llmDefaults(provider);
  const base = config.llm.baseUrl || d.baseUrl; const model = config.llm.model || d.model;
  if (provider === 'ollama') {
    const r = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, stream: false }) });
    const j = await r.json(); return { content: j.message?.content || '', provider, model };
  }
  const r = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.llm.apiKey}` }, body: JSON.stringify({ model, messages }) });
  const j = await r.json(); return { content: j.choices?.[0]?.message?.content || '', provider, model };
}

function mockFollow(q) {
  const t = String(q || '');
  if (/沒預算|太貴|價格|貴/.test(t)) return '可以這樣接：先別急著降價，改談「分階段投入」或「先小後大」，讓他用較低門檻體驗價值；同時凸顯不做的隱形成本。把焦點從「多少錢」轉到「值不值得、能解決什麼」。';
  if (/考慮|再想|猶豫/.test(t)) return '他要「再想想」通常是還沒被說服或怕做錯。問一句：「你最在意的是哪一點？我針對那點再幫你看看」——把模糊的猶豫變成具體問題，逐一化解，比一直催有效。';
  if (/競[爭品]|比較|別家/.test(t)) return '別貶低對手。用「我們最適合像你這種情況的原因」來區隔，聚焦你獨有的價值與售後保障，讓他覺得選你最安心。';
  return '建議先釐清他真正的顧慮點，用傾聽換信任；接著給一個低風險的下一步（試用/小額/簡短會談），讓他容易答應，再逐步推進。';
}
