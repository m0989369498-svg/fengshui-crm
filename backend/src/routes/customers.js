import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer, updateCustomer, removeCustomer, interactionsByPhone } from '../services/store.js';
import { AppError, ErrorCodes } from '../common/errors.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', wrap(async (req, res) => res.json({ ok: true, backend: 'jsonl', items: await listCustomers(req.query.q || '', Number(req.query.limit || 200)) })));
router.post('/', wrap(async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name && !phone) throw new AppError(ErrorCodes.BAD_INPUT, '至少需要姓名或手機。', 400);
  res.json({ ok: true, customer: await createCustomer(req.body || {}) });
}));
router.get('/:id', wrap(async (req, res) => {
  const c = await getCustomer(req.params.id);
  if (!c) throw new AppError(ErrorCodes.NOT_FOUND, '找不到客戶。', 404);
  res.json({ ok: true, customer: c, interactions: await interactionsByPhone(c.phone) });
}));
router.put('/:id', wrap(async (req, res) => {
  const c = await updateCustomer(req.params.id, req.body || {});
  if (!c) throw new AppError(ErrorCodes.NOT_FOUND, '找不到客戶。', 404);
  res.json({ ok: true, customer: c });
}));
router.delete('/:id', wrap(async (req, res) => {
  if (!await removeCustomer(req.params.id)) throw new AppError(ErrorCodes.NOT_FOUND, '找不到客戶。', 404);
  res.json({ ok: true });
}));

export default router;
