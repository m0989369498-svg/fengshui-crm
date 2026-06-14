import { Router } from 'express';
import { generateStrategy, generateStrategyStream, followUp } from '../services/strategyService.js';
import { llmStatus } from '../services/llmService.js';
import { listInteractions } from '../services/store.js';
import { AppError, ErrorCodes } from '../common/errors.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/llm-health', (_req, res) => res.json({ ok: true, ...llmStatus() }));

router.post('/strategy', wrap(async (req, res) => {
  const { customer, salesQuestion, lang } = req.body || {};
  if (!customer) throw new AppError(ErrorCodes.BAD_INPUT, '缺少 customer。', 400);
  res.json({ ok: true, ...(await generateStrategy(customer, { salesQuestion, lang })) });
}));

router.post('/strategy-stream', wrap(async (req, res) => {
  const { customer, salesQuestion, lang } = req.body || {};
  if (!customer) throw new AppError(ErrorCodes.BAD_INPUT, '缺少 customer。', 400);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  const send = (o) => res.write(JSON.stringify(o) + '\n');
  try {
    const { provider, model } = await generateStrategyStream(customer, { salesQuestion, lang }, {
      onFeatures: (f) => send({ type: 'features', ...f }),
      onToken: (t) => send({ type: 'token', content: t }),
    });
    send({ type: 'meta', provider, model });
  } catch (err) {
    const e = err?.toJSON ? err.toJSON().error : { code: 'INTERNAL', message: String(err?.message || err) };
    send({ type: 'error', error: e });
  } finally { res.end(); }
}));

router.post('/followup', wrap(async (req, res) => {
  const { history, userMessage, customerContext, lang } = req.body || {};
  if (!userMessage) throw new AppError(ErrorCodes.BAD_INPUT, '缺少 userMessage。', 400);
  res.json({ ok: true, ...(await followUp({ history, userMessage, customerContext, lang })) });
}));

router.get('/history', wrap(async (req, res) => {
  res.json({ ok: true, items: await listInteractions(Number(req.query.limit || 30)) });
}));

export default router;
