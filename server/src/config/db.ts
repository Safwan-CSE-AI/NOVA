import mongoose from 'mongoose';

export let isUsingMemoryDB = false;
let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nova_personalization';

  // Try live MongoDB first
  try {
    console.log('[DB] Attempting connection to MongoDB at:', uri);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('[DB] ✅ Successfully connected to live MongoDB database');
    isUsingMemoryDB = false;
    return;
  } catch (err: any) {
    console.warn(`[DB] Live MongoDB not reachable (${err.message})`);
  }

  // Try MongoMemoryServer (fast if already downloaded, slow on first run)
  try {
    // Check if MongoDB binary is already cached
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    
    // Start with a short timeout — if it doesn't start quickly, fall back
    const serverPromise = MongoMemoryServer.create({
      instance: { dbName: 'nova_personalization_inmem' },
    });
    
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('MongoMemoryServer start timeout (10s)')), 10000)
    );

    const result = await Promise.race([serverPromise, timeoutPromise]);
    
    if (result) {
      memoryServer = result;
      const memUri = (memoryServer as any).getUri();
      await mongoose.connect(memUri);
      isUsingMemoryDB = false; // Using real mongoose with in-memory mongo
      console.log('[DB] ✅ MongoMemoryServer started successfully');
      return;
    }
  } catch (memErr: any) {
    console.warn('[DB] MongoMemoryServer not available:', memErr.message);
    console.log('[DB] ⚡ Activating pure in-memory data store (zero dependencies)');
  }

  // Final fallback: pure in-memory mode using dataStore.ts
  isUsingMemoryDB = true;
  (global as any).isInMemoryDB = true;
  console.log('[DB] ✅ In-Memory Data Store active — all operations served from RAM');
  console.log('[DB] ℹ️  Data resets on server restart. To persist, set MONGODB_URI in server/.env');
}

export async function closeDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
