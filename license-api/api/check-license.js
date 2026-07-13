const { isRevoked } = require("../lib/db");

// Vercel calls this automatically for any request to /api/check-license
module.exports = async (req, res) => {
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
    // On any error, default to NOT revoked so an outage never locks out a
    // paying customer who hasn't actually been revoked.
    return res.status(200).json({ revoked: false, checked: false });
  }
};
