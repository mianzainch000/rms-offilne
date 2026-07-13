/**
 * License Check API — for traditional hosting (Render / a VPS / etc).
 * If deploying to Vercel instead, you don't need this file — Vercel uses
 * api/check-license.js and api/health.js directly (serverless functions).
 *
 * Deploy this YOURSELF (owner), separately from the customer app.
 * Customer installs never contain this folder or its database credentials.
 *
 * RUN:
 *   cd license-api
 *   npm install
 *   LICENSE_DB_URI="mongodb+srv://..." node server.js
 */
require("dotenv").config();
const express = require("express");
const { isRevoked } = require("./lib/db");

const PORT = process.env.PORT || 4002;
const app = express();

// Same path as the Vercel version (/api/check-license) so
// LICENSE_API_URL + "/api/check-license" works identically on either host.
app.get("/api/check-license", async (req, res) => {
  try {
    const computerId = String(req.query.computerId || "")
      .trim()
      .toUpperCase();
    if (!computerId || computerId.length < 8) {
      return res.status(400).json({ message: "computerId is required" });
    }
    const revoked = await isRevoked(computerId);
    return res.status(200).json({ revoked });
  } catch (err) {
    console.error("check-license error:", err.message);
    return res.status(200).json({ revoked: false, checked: false });
  }
});

app.get("/api/health", (req, res) => res.status(200).json({ ok: true }));

if (!process.env.LICENSE_DB_URI || !process.env.LICENSE_DB_URI.trim()) {
  console.log(
    "❌ LICENSE_DB_URI is not set. Set it to your own (owner's) Atlas connection string.",
  );
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`✅ License check API running on port ${PORT}`);
});
