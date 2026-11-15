import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { CONFIG } from './config.js';
import { authRouter } from './routes/auth.js';
import { membersRouter } from './routes/members.js';
import { medicinesRouter } from './routes/medicines.js';
import { dosesRouter } from './routes/doses.js';
import { receiptsRouter } from './routes/receipts.js';
import { dutyRouter } from './routes/duty.js';
import { checkinsRouter } from './routes/checkins.js';
import { appointmentsRouter } from './routes/appointments.js';
import { dadiRouter } from './routes/dadi.js';
import { insightsRouter } from './routes/insights.js';
import { auditRouter } from './routes/audit.js';
import { demoRouter } from './routes/demo.js';

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, // For local dev and embedded assets
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev servers or same-origin
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AANGAN API', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/members', membersRouter);
app.use('/api/medicines', medicinesRouter);
app.use('/api/doses', dosesRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/duty', dutyRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/dadi', dadiRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/demo', demoRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});
