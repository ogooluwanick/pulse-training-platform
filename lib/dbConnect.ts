import mongoose from 'mongoose';

// Import models to ensure they are registered
import '@/lib/models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;

  // One-time startup migration: ensure non-unique index for CourseAssignment
  // Remove later
  try {
    const db = mongoose.connection.db;
    if (db) {
      const collection = db.collection('courseassignments');
      const indexes = await collection.indexes();
      const targetIndexName = 'employee_1_course_1_companyId_1';
      const existing = indexes.find((idx: any) => idx.name === targetIndexName);

      if (existing && existing.unique) {
        try {
          await collection.dropIndex(targetIndexName);
          // Recreate a non-unique index to preserve query performance
          await collection.createIndex(
            { employee: 1, course: 1, companyId: 1 },
            { background: true }
          );
          // eslint-disable-next-line no-console
          console.log(
            '[Indexes] Dropped unique index and created non-unique on courseassignments { employee, course, companyId }'
          );
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error(
            '[Indexes] Failed adjusting courseassignments index:',
            err?.message || err
          );
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      '[Indexes] Error during index check:',
      (e as any)?.message || e
    );
  }
  return cached.conn;
}

export default dbConnect;
