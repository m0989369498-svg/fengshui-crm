export class AppError extends Error {
  constructor(code, message, http = 500, detail = '') {
    super(message);
    this.code = code; this.http = http; this.detail = detail;
  }
  toJSON() { return { ok: false, error: { code: this.code, message: this.message, detail: this.detail } }; }
}

export const ErrorCodes = {
  BAD_INPUT: 'BAD_INPUT',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  LLM_UNAVAILABLE: 'LLM_UNAVAILABLE',
  LLM_ERROR: 'LLM_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL: 'INTERNAL',
};

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.http).json(err.toJSON());
  console.error('[UNEXPECTED]', err);
  return res.status(500).json({ ok: false, error: { code: ErrorCodes.INTERNAL, message: '系統內部錯誤。', detail: '' } });
}
