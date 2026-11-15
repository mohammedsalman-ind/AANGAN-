import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'aangan-secure-jwt-secret-key-minimum-32-chars-long!',
  actionSecret: process.env.ACTION_SECRET || 'aangan-hmac-one-click-action-secret-key-32-chars!',
  demoMode: process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true' || true,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Aangan Care" <care@aangan.family>',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },
  cookieName: 'aangan_session',
  saltBytes: 16,
  keyLen: 64,
  lockoutThreshold: 5,
  lockoutMinutes: 5,
};
