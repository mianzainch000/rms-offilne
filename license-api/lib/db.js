const { MongoClient } = require("mongodb");

const CLOUD_URI = process.env.LICENSE_DB_URI;

let cachedClient = null;

async function getClient() {
  if (!CLOUD_URI || !CLOUD_URI.trim()) {
    throw new Error(
      "LICENSE_DB_URI is not set. Set it in your hosting provider's environment variables.",
    );
  }
  if (cachedClient) return cachedClient;
  const client = new MongoClient(CLOUD_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  cachedClient = client;
  return client;
}

async function isRevoked(computerId) {
  const client = await getClient();
  const doc = await client
    .db()
    .collection("licenses")
    .findOne({ computerId }, { projection: { status: 1 } });
  return Boolean(doc && doc.status === "revoked");
}

module.exports = { getClient, isRevoked };
