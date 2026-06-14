import { Router } from 'express';
import { selectDates, SUPPORTED_PURPOSES } from '../engines/dateSelection.js';
import { AppError, ErrorCodes } from '../common/errors.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/purposes', (_req, res) => res.json({ ok: true, purposes: SUPPORTED_PURPOSES }));
router.post('/select', wrap(async (req, res) => {
  const { start, end, purpose, birth, limit } = req.body || {};
  if (!start || !end) throw new AppError(ErrorCodes.BAD_INPUT, '需提供 start 與 end (YYYY-MM-DD)。', 400);
  res.json({ ok: true, ...selectDates({ start, end, purpose, birth, limit }) });
}));

export default router;
