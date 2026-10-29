import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function _connect(): Promise<typeof mongoose> {
  return mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 7000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    heartbeatFrequencyMS: 15000,
    maxIdleTimeMS: 30000,
  });
}

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables');

  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    // Hard 9s timeout wraps the entire connection attempt including DNS SRV resolution
    const deadline = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB connection timed out')), 9000)
    );
    cached.promise = Promise.race([_connect(), deadline])
      .catch((err) => {
        cached.promise = null;
        throw err;
      }) as Promise<typeof mongoose>;
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
