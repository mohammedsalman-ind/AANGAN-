import { CONFIG } from '../config.js';
import type { StorageAdapter } from './adapter.js';
import { InMemoryStorageAdapter } from './memory.js';
import { FirestoreStorageAdapter } from './firestore.js';
import admin from 'firebase-admin';

export let storage: StorageAdapter;

if (CONFIG.firebase.projectId && CONFIG.firebase.clientEmail && CONFIG.firebase.privateKey) {
  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: CONFIG.firebase.projectId,
        clientEmail: CONFIG.firebase.clientEmail,
        privateKey: CONFIG.firebase.privateKey,
      }),
    });
    storage = new FirestoreStorageAdapter(app);
    console.log('[Storage] Initialized Firestore storage adapter');
  } catch (err) {
    console.warn('[Storage] Failed to initialize Firestore, falling back to In-Memory:', err);
    storage = new InMemoryStorageAdapter();
  }
} else {
  console.log('[Storage] No Firestore credentials found. Using IN-MEMORY storage adapter (all data stays in RAM)');
  storage = new InMemoryStorageAdapter();
}
