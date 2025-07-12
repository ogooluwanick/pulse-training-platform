// lib/mongodb.ts

import { MongoClient, MongoClientOptions } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getMongoClientPromise(): Promise<MongoClient> {
  const currentMongoUri = process.env.MONGODB_URI;

  if (!currentMongoUri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (process.env.NODE_ENV === "development") {
    // Use a global variable in development to preserve the promise across HMR reloads
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(currentMongoUri, {});
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(currentMongoUri, {});
      clientPromise = client.connect();
    }
  }
  return clientPromise;
}

// Export the function that returns the promise.
// This is imported and called by other parts of the app, like the NextAuth adapter.
export default getMongoClientPromise;
