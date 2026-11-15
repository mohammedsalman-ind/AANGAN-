import { storage } from '../storage/index.js';
import { seedDatabase } from '../services/seed.js';

async function run() {
  try {
    await seedDatabase(storage);
    console.log('Seed runner completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed runner failed:', err);
    process.exit(1);
  }
}

run();
