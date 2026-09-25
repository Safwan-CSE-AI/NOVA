import mongoose from 'mongoose';

export let isUsingMemoryDB = false;

export async function connectDB(): Promise<void> {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    isUsingMemoryDB = false;
    return;
  }
  if ((global as any).isInMemoryDB) {
    isUsingMemoryDB = true;
    return;
  }

  const uri = process.env.MONGODB_URI;
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  // If on Vercel and no external MongoDB URI is configured (or if URI is localhost), use in-memory store immediately
  if (isVercel && (!uri || uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    console.log('[DB] ⚡ Vercel Serverless environment detected without external MongoDB. Activating instant In-Memory store.');
    isUsingMemoryDB = true;
    (global as any).isInMemoryDB = true;
    return;
  }

  // If a real external MongoDB URI is provided (e.g. MongoDB Atlas)
  if (uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
    try {
      console.log('[DB] Connecting to external MongoDB database...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log('[DB] ✅ Successfully connected to MongoDB database');
      isUsingMemoryDB = false;
      return;
    } catch (err: any) {
      console.warn(`[DB] External MongoDB connection failed (${err.message}). Falling back to In-Memory store.`);
    }
  }

  // Local development fallback
  if (!isVercel && uri) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 1500,
      });
      console.log('[DB] ✅ Connected to local MongoDB');
      isUsingMemoryDB = false;
      return;
    } catch {
      // Local Mongo not running
    }
  }

  // Pure In-Memory Data Store fallback (Zero external dependencies, works everywhere)
  isUsingMemoryDB = true;
  (global as any).isInMemoryDB = true;
  console.log('[DB] ✅ In-Memory Data Store active — all operations served from RAM');
}

export async function closeDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
