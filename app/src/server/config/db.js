const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If mongoose's connection has actually dropped (e.g. MongoDB restarted),
  // don't trust a stale cached.conn — force a fresh connect attempt.
  if (cached.conn && cached.conn.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI missing in environment");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB error:", err);
        // IMPORTANT: clear the cached promise so the NEXT request retries
        // connecting instead of reusing this same rejected promise forever.
        // Without this, once MongoDB is unreachable once, every future
        // request fails instantly even after MongoDB comes back online —
        // the only fix would have been restarting the whole Node process.
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Also clear here in case cached.promise was set by a concurrent request
    // that hit the .catch above between our check and our await.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
