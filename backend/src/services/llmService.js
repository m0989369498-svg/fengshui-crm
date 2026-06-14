/**
 * llmService.js — 可切換 LLM（mock / openai / deepseek / ollama）
 * mock：零設定，用內建產生器。其餘：OpenAI 相容或 Ollama，需 .env 設金鑰/端點。
 */
import { config, llmDefaults } from '../config.js';
import { generateMockStrategy } from '../mock/mockLLM.js';
import { AppError, ErrorCodes } from '../common/errors.js';

const LANG = (l) => (l === 'zh-Hans' ? '简体中文' : '繁體中文');

/** 組白話策略提示詞（真 LLM 用）。 */
export function buildMessages({ customer = {}, features = {}, salesQuestion = '', lang = 'zh-Hant' }) {
  const dims = (features.profile?.dimensions || []).map((d) => `  - ${d}`).join('\n');
  const personalTags = (features.tags || []).filter((t) => !t.includes('(地址)') && !t.startsWith('四柱') && !t.startsWith('日主'));
  const env = (features.spatialTags || []).join('、') || '（無地址資料）';
  const system = [
    '你是「不帶羅盤的風水師」CRM 的首席策略顧問，融合東方玄學與行為科學。',
    '把命理/磁場訊號「翻譯」成業務員可立刻執行的白話商業策略。',
    '【硬性規則】1. 嚴禁輸出術數術語（干支/卦象/神煞）。2. 個人訊號(手機/本命)權重80%、地址20%。',
    `3. 一律用${LANG(lang)}。4. 輸出四段：【顧客輪廓】(≥4行) /【溝通策略】(3點) /【成交切入】(話術) /【下一步行動】(1句)。`,
  ].join('\n');
  const user = [
    `資料完整度：${features.dataLevel}`,
    customer.name ? `姓名：${String(customer.name).replace(/\s+/g, ' ').slice(0, 20)}` : '',
    customer.gender ? `性別：${customer.gender === 'female' ? '女' : '男'}` : '',
    '深度命理訊號（內部參考、請轉白話勿照抄術語）：',
    dims,
    `其他標籤：${personalTags.join('、')}`,
    `居住環境磁場（20%）：${env}`,
    `業務提問：${salesQuestion || '請給我這位顧客的整體溝通與成交策略。'}`,
  ].filter(Boolean).join('\n');
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

function resolved() {
  const p = config.llm.provider;
  if (p === 'mock') return { provider: 'mock' };
  if ((p === 'openai' || p === 'deepseek') && !config.llm.apiKey) {
    return { provider: 'mock', note: 'no-api-key-fallback' };
  }
  const d = llmDefaults(p);
  return { provider: p, baseUrl: config.llm.baseUrl || d.baseUrl, model: config.llm.model || d.model, apiKey: config.llm.apiKey };
}

/**
 * 產生策略（可串流）。onToken 提供時逐塊回呼。
 * @returns {Promise<{content,provider,model}>}
 */
export async function generateStrategy({ customer, features, salesQuestion, lang }, onToken) {
  const r = resolved();
  if (r.provider === 'mock') {
    const content = generateMockStrategy({ customer, features, salesQuestion });
    if (onToken) await streamText(content, onToken);
    return { content, provider: 'mock', model: 'builtin' };
  }
  const messages = buildMessages({ customer, features, salesQuestion, lang });
  if (r.provider === 'ollama') return ollama(messages, r, onToken);
  return openaiCompat(messages, r, onToken);
}

// 把 mock 內容當作串流逐字吐出
async function streamText(text, onToken) {
  for (let i = 0; i < text.length; i += 2) {
    onToken(text.slice(i, i + 2));
    // 輕微節流讓前端有逐字感（不阻塞太久）
    if (i % 40 === 0) await new Promise((res) => setTimeout(res, 8));
  }
}

async function openaiCompat(messages, r, onToken) {
  const body = { model: r.model, messages, temperature: config.llm.temperature, stream: Boolean(onToken) };
  try {
    const resp = await fetch(`${r.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${r.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new AppError(ErrorCodes.LLM_ERROR, `LLM 回應 ${resp.status}`, 502, (await resp.text()).slice(0, 200));
    if (!onToken) {
      const j = await resp.json();
      return { content: j.choices?.[0]?.message?.content || '', provider: r.provider, model: r.model };
    }
    let full = '';
    for await (const line of ndjson(resp.body)) {
      if (!line.startsWith('data:')) continue;
      const p = line.slice(5).trim();
      if (p === '[DONE]') break;
      try { const t = JSON.parse(p).choices?.[0]?.delta?.content || ''; if (t) { full += t; onToken(t); } } catch { /* skip */ }
    }
    return { content: full, provider: r.provider, model: r.model };
  } catch (e) { throw e instanceof AppError ? e : new AppError(ErrorCodes.LLM_UNAVAILABLE, '無法連線 LLM（檢查金鑰/端點）。', 503, String(e.message)); }
}

async function ollama(messages, r, onToken) {
  try {
    const resp = await fetch(`${r.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: r.model, messages, stream: Boolean(onToken), options: { temperature: config.llm.temperature } }),
    });
    if (!resp.ok) throw new AppError(ErrorCodes.LLM_ERROR, `Ollama 回應 ${resp.status}`, 502);
    if (!onToken) { const j = await resp.json(); return { content: j.message?.content || '', provider: 'ollama', model: r.model }; }
    let full = '';
    for await (const line of ndjson(resp.body)) {
      try { const j = JSON.parse(line); const t = j.message?.content || ''; if (t) { full += t; onToken(t); } if (j.done) break; } catch { /* skip */ }
    }
    return { content: full, provider: 'ollama', model: r.model };
  } catch (e) { throw e instanceof AppError ? e : new AppError(ErrorCodes.LLM_UNAVAILABLE, '無法連線本機 Ollama。', 503, String(e.message)); }
}

async function* ndjson(body) {
  const reader = body.getReader(); const dec = new TextDecoder(); let buf = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) yield l; }
  }
  buf += dec.decode(); if (buf.trim()) yield buf.trim();
}

export function llmStatus() {
  const r = resolved();
  return { provider: r.provider, configured: config.llm.provider, apiKeySet: Boolean(config.llm.apiKey), note: r.note || null };
}
