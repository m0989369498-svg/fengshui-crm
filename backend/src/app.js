import express from 'express';
import cors from 'cors';
import { errorHandler } from './common/errors.js';
import { llmStatus } from './services/llmService.js';
import interactionRoutes from './routes/interaction.js';
import customerRoutes from './routes/customers.js';
import calendarRoutes from './routes/calendar.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'fengshui-crm-demo', llm: llmStatus().provider }));

  app.use('/api/interaction', interactionRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/calendar', calendarRoutes);

  app.use(errorHandler);
  return app;
}
export default createApp;
