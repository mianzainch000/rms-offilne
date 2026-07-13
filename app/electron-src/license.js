const crypto = require("crypto");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { machineIdSync } = require("node-machine-id");

const SECRET_SALT = "INV-ZAIN-2026-SECRET-XK9P";

const DEACTIVATE_SALT = "INV-ZAIN-DEACTIVATE-2026-YP7Q";

function getComputerId() {
  const rawId = machineIdSync(true);
  const hash = crypto
    .createHash("sha256")
    .update(rawId)
    .digest("hex")
    .toUpperCase();

  return hash.substring(0, 16);
}

function computeExpectedKey(computerId) {
  const hash = crypto
    .createHash("sha256")
    .update(`${computerId}-${SECRET_SALT}`)
    .digest("hex")
    .toUpperCase();
  return `${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
}

function computeExpectedDeactivationCode(computerId) {
  const hash = crypto
    .createHash("sha256")
    .update(`${computerId}-${DEACTIVATE_SALT}`)
    .digest("hex")
    .toUpperCase();
  return `DEL-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

function verifyDeactivationCode(computerId, enteredCode) {
  const expected = computeExpectedDeactivationCode(computerId);
  const clean = (enteredCode || "").trim().toUpperCase();
  return clean === expected;
}

function markDeactivated() {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    data.revoked = true;
    data.deactivatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
  } catch {}
}

function clearRevoked() {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (data.revoked) {
      delete data.revoked;
      delete data.deactivatedAt;
      fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
    }
  } catch {}
}

function wasRevokedLocally() {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.revoked === true;
  } catch {
    return false;
  }
}

function verifyKey(computerId, enteredKey) {
  const expected = computeExpectedKey(computerId);
  const clean = (enteredKey || "").trim().toUpperCase();
  return clean === expected;
}

function getLicenseFilePath() {
  const base =
    (global.__ELECTRON_USER_DATA__ && global.__ELECTRON_USER_DATA__) ||
    path.join(os.homedir(), ".neno-pos");
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, "license.dat");
}

function saveActivation(computerId, key) {
  const filePath = getLicenseFilePath();
  const payload = { computerId, key, activatedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(payload), "utf-8");
}

function isActivated() {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (data.revoked === true) return false;
    const currentId = getComputerId();

    return data.computerId === currentId && verifyKey(currentId, data.key);
  } catch {
    return false;
  }
}

async function checkRemoteLicenseStatus(computerId) {
  // IMPORTANT: this must NEVER connect directly to MongoDB/Atlas from the
  // customer's installed app. A raw connection string bundled in the app
  // can be extracted from the installer in seconds (npx asar extract) and
  // used to read/write your database directly — including a customer
  // flipping their own "revoked" flag back to "active" to defeat the
  // deactivate/kill-switch feature.
  //
  // Instead, the app only calls a small HTTP API (license-api/server.js,
  // deployed separately by the owner) which holds the real database
  // credentials server-side and only ever answers "revoked: true/false".
  const apiUrl = process.env.LICENSE_API_URL;
  if (!apiUrl || !apiUrl.trim()) {
    return { checked: false, reason: "not-configured" };
  }

  try {
    const url = `${apiUrl.replace(/\/$/, "")}/api/check-license?computerId=${encodeURIComponent(computerId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { checked: false, reason: "network-error" };
    }
    const data = await response.json();
    if (data && data.revoked === true) {
      return { checked: true, revoked: true };
    }
    return { checked: true, revoked: false };
  } catch (err) {
    return { checked: false, reason: "network-error" };
  }
}

module.exports = {
  getComputerId,
  computeExpectedKey,
  verifyKey,
  computeExpectedDeactivationCode,
  verifyDeactivationCode,
  markDeactivated,
  clearRevoked,
  wasRevokedLocally,
  saveActivation,
  isActivated,
  checkRemoteLicenseStatus,
  getLicenseFilePath,
};
