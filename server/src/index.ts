import { app } from './app.js';
import { CONFIG } from './config.js';
import { storage } from './storage/index.js';
import { seedDatabase } from './services/seed.js';
import { AlertEngine } from './services/alertEngine.js';
import cron from 'node-cron';

async function bootstrap() {
  // Always seed initial "Sharma Aangan" demo data if circle doesn't exist
  await seedDatabase(storage);

  const alertEngine = new AlertEngine(storage);

  // Run alert engine tick every minute
  cron.schedule('* * * * *', async () => {
    try {
      await alertEngine.runTick();
    } catch (err) {
      console.error('[AlertEngine Cron Error]:', err);
    }
  });

  const server = app.listen(CONFIG.port, () => {
    console.log(`\n🏡 AANGAN (आँगन) Server running on http://localhost:${CONFIG.port}`);
    console.log(`   Health check: http://localhost:${CONFIG.port}/health`);
    console.log(`   Demo code: AANGAN (Dadaji: 1111, Priya: 2222, Rahul: 3333)\n`);
  });

  process.on('SIGTERM', () => {
    server.close();
  });
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]:', err);
  process.exit(1);
});
