require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env.local"),
});
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const { resolveTool } = require("./find-mongo-tools");

const LOCAL_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tableturn-pos";
const CLOUD_URI = process.env.CLOUD_BACKUP_URI;

function log(msg) {
  console.log(`[cloud-sync] ${new Date().toLocaleString()} — ${msg}`);
}

function dbNameFromUri(uri) {
  try {
    const withoutQuery = uri.split("?")[0];
    const afterHost = withoutQuery.split("/").slice(3).join("/");
    const name = afterHost.replace(/\/+$/, "");
    return name || null;
  } catch {
    return null;
  }
}

async function runCloudSync() {
  if (!CLOUD_URI || CLOUD_URI.trim() === "") {
    log("CLOUD_BACKUP_URI set nahi hai (.env.local mein) — cloud sync skip.");
    return { ok: false, reason: "not-configured" };
  }

  const tmpDir = path.join(os.tmpdir(), `pos-cloud-sync-${Date.now()}`);

  const mongodumpCmd = resolveTool("mongodump");
  const mongorestoreCmd = resolveTool("mongorestore");
  if (!mongodumpCmd || !mongorestoreCmd) {
    log("MongoDB Database Tools nahi milin — cloud sync skip.");
    return { ok: false, reason: "tools-missing" };
  }

  const localDb = dbNameFromUri(LOCAL_URI) || "tableturn-pos";
  const cloudDb = dbNameFromUri(CLOUD_URI);

  if (!cloudDb) {
    log(
      "CLOUD_BACKUP_URI mein database ka naam nahi mila (URL ke aakhir mein /database-name hona chahiye).",
    );
    return { ok: false, reason: "invalid-cloud-db-name" };
  }

  try {
    log(`Local database ("${localDb}") ka dump le rahe hain...`);
    execSync(
      `${mongodumpCmd} --uri="${LOCAL_URI}" --excludeCollection=licenses --out="${tmpDir}"`,
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const dumpDbDir = path.join(tmpDir, localDb);

    log(`Cloud (Atlas) par "${cloudDb}" database mein mirror kar rahe hain...`);

    const restoreCmd =
      `${mongorestoreCmd} --uri="${CLOUD_URI}" --drop ` +
      `--nsFrom="${localDb}.*" --nsTo="${cloudDb}.*" "${dumpDbDir}"`;

    execSync(restoreCmd, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 2 * 60 * 1000,
    });

    log(
      `✅ Cloud backup sync mukammal ho gaya — database "${cloudDb}" update ho gayi.`,
    );
    return { ok: true, cloudDb };
  } catch (err) {
    const detail = (err.stderr ? err.stderr.toString() : err.message || "")
      .split("\n")
      .slice(0, 3)
      .join(" | ");
    log(
      `⚠️ Cloud sync fail: ${detail || "wajah maloom nahi (internet check karein)"}`,
    );
    return { ok: false, reason: "network-or-tools-error", detail };
  } finally {
    try {
      if (fs.existsSync(tmpDir))
        fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

if (require.main === module) {
  runCloudSync().then((r) => {
    if (!r.ok) process.exitCode = 1;
  });
}

module.exports = { runCloudSync };
