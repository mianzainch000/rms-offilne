require("dotenv").config({
  path: require("path").join(__dirname, "..", "..", ".env.admin"),
});
const path = require("path");
const express = require("express");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const SECRET_SALT = "INV-ZAIN-2026-SECRET-XK9P";
const DEACTIVATE_SALT = "INV-ZAIN-DEACTIVATE-2026-YP7Q";

const CLOUD_URI = process.env.LICENSE_DB_URI;
const PORT = 4001;

function computeActivationKey(computerId) {
  const hash = crypto
    .createHash("sha256")
    .update(`${computerId}-${SECRET_SALT}`)
    .digest("hex")
    .toUpperCase();
  return `${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
}

function computeDeactivationCode(computerId) {
  const hash = crypto
    .createHash("sha256")
    .update(`${computerId}-${DEACTIVATE_SALT}`)
    .digest("hex")
    .toUpperCase();
  return `DEL-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

async function main() {
  if (!CLOUD_URI || CLOUD_URI.trim() === "") {
    console.log(
      "❌ CLOUD_BACKUP_URI .env.local mein set nahi hai. Pehle wo set karein, phir dobara try karein.",
    );
    process.exit(1);
  }

  const client = new MongoClient(CLOUD_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const licenses = client.db().collection("licenses");
  console.log("✅ Atlas se connected — licenses collection ready.");

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/licenses", async (req, res) => {
    try {
      const docs = await licenses.find({}).sort({ activatedAt: -1 }).toArray();
      res.json(docs);
    } catch (err) {
      res.status(500).json({
        message: "Atlas se data load nahi ho saka. Internet check karein.",
      });
    }
  });

  app.post("/api/licenses/activate", async (req, res) => {
    try {
      const computerId = (req.body.computerId || "").trim().toUpperCase();
      const name = (req.body.name || "").trim();
      const phone = (req.body.phone || "").trim();
      if (!computerId || computerId.length < 8) {
        return res
          .status(400)
          .json({ message: "Computer ID theek se daalein." });
      }
      const key = computeActivationKey(computerId);
      const now = new Date();

      const existing = await licenses.findOne({ computerId });
      const setFields = {
        computerId,
        key,
        status: "active",
        lastUpdatedAt: now,
      };
      if (name) setFields.name = name;
      else if (existing?.name) setFields.name = existing.name;

      if (phone) setFields.phone = phone;
      else if (existing?.phone) setFields.phone = existing.phone;

      await licenses.updateOne(
        { computerId },
        {
          $set: setFields,
          $setOnInsert: { activatedAt: now },
        },
        { upsert: true },
      );

      res.json({ key });
    } catch (err) {
      res.status(500).json({
        message: "Atlas par likhne mein masla — internet check karein.",
      });
    }
  });

  app.post("/api/licenses/deactivate", async (req, res) => {
    try {
      const computerId = (req.body.computerId || "").trim().toUpperCase();
      if (!computerId)
        return res.status(400).json({ message: "Computer ID missing." });

      const deactivationCode = computeDeactivationCode(computerId);
      await licenses.updateOne(
        { computerId },
        { $set: { status: "revoked", deactivatedAt: new Date() } },
        { upsert: true },
      );

      res.json({ deactivationCode });
    } catch (err) {
      res.status(500).json({
        message: "Atlas par likhne mein masla — internet check karein.",
      });
    }
  });

  app.post("/api/licenses/reactivate", async (req, res) => {
    try {
      const computerId = (req.body.computerId || "").trim().toUpperCase();
      if (!computerId)
        return res.status(400).json({ message: "Computer ID missing." });

      await licenses.updateOne(
        { computerId },
        { $set: { status: "active" }, $unset: { deactivatedAt: "" } },
        { upsert: true },
      );

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        message: "Atlas par likhne mein masla — internet check karein.",
      });
    }
  });

  app.post("/api/licenses/update", async (req, res) => {
    try {
      const computerId = (req.body.computerId || "").trim().toUpperCase();
      const name = (req.body.name || "").trim();
      const phone = (req.body.phone || "").trim();
      if (!computerId)
        return res.status(400).json({ message: "Computer ID missing." });

      const result = await licenses.updateOne(
        { computerId },
        { $set: { name, phone } },
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Record nahi mila." });
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        message: "Atlas par likhne mein masla — internet check karein.",
      });
    }
  });

  app.post("/api/licenses/delete", async (req, res) => {
    try {
      const computerId = (req.body.computerId || "").trim().toUpperCase();
      if (!computerId)
        return res.status(400).json({ message: "Computer ID missing." });

      await licenses.deleteOne({ computerId });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        message: "Atlas se delete karne mein masla — internet check karein.",
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`\n✅ License Admin ready: http://localhost:${PORT}\n`);
    try {
      require("child_process").exec(`start http://localhost:${PORT}`);
    } catch {}
  });
}

main().catch((err) => {
  console.error("❌ License Admin start nahi ho saka:", err.message);
  process.exit(1);
});
