require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env.local"),
});
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { resolveTool } = require("./find-mongo-tools");

function log(msg) {
  console.log(msg);
}

async function runLocalBackup() {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tableturn-pos";

  const backupsRoot = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupsRoot)) {
    fs.mkdirSync(backupsRoot, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(backupsRoot, stamp);

  log(`\n📦 Local database backup shuru ho raha hai...`);
  log(`   Source : ${MONGO_URI}`);
  log(`   Target : ${outDir}\n`);

  const mongodumpCmd = resolveTool("mongodump");
  if (!mongodumpCmd) {
    log("\n❌ 'mongodump' nahi mila. MongoDB Database Tools install karein:");
    log("   https://www.mongodb.com/try/download/database-tools\n");
    return { ok: false, reason: "tools-missing" };
  }

  try {
    execSync(`${mongodumpCmd} --uri="${MONGO_URI}" --out="${outDir}"`, {
      stdio: "pipe",
    });
    log(`\n✅ Backup mukammal ho gaya: ${outDir}\n`);
    return { ok: true, outDir };
  } catch (err) {
    log(
      "\n❌ Backup fail ho gaya. Check karein ke Local MongoDB Server chal rahi hai.\n",
    );
    return { ok: false, reason: "backup-failed" };
  }
}

if (require.main === module) {
  runLocalBackup().then((r) => {
    if (!r.ok) process.exitCode = 1;
  });
}

module.exports = { runLocalBackup };
