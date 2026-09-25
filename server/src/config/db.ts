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
  const isValidMongoUri = Boolean(uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')));

  // If on Vercel or environment without a valid MongoDB connection string, use instant in-memory store
  if (!isValidMongoUri || isVercel && (uri?.includes('127.0.0.1') || uri?.includes('localhost'))) {
    console.log('[DB] ⚡ Activating instant In-Memory store (zero configuration needed).');
    isUsingMemoryDB = true;
    (global as any).isInMemoryDB = true;
    return;
  }

  // If a real external MongoDB URI is provided (e.g. MongoDB Atlas)
  if (isValidMongoUri) {
    try {
      console.log('[DB] Connecting to external MongoDB database...');
      await mongoose.connect(uri!, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[DB] ✅ Successfully connected to MongoDB database');
      isUsingMemoryDB = false;
      return;
    } catch (err: any) {
      console.warn(`[DB] External MongoDB connection failed (${err.message}). Falling back to In-Memory store.`);
      isUsingMemoryDB = true;
      (global as any).isInMemoryDB = true;
      return;
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
