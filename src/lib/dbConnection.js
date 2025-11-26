import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("❌ MONGODB_URI is missing in .env.local");

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Reuse the client on hot reloads
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

clientPromise = client.connect();

export async function getCollection(collectionName) {
  const db = (await clientPromise).db();
  return db.collection(collectionName);
}
