require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env.local"),
});
const path = require("path");
const fs = require("fs");
const os = require("os");
const readline = require("readline");
const { execSync } = require("child_process");
const { resolveTool } = require("./find-mongo-tools");

const LOCAL_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tableturn-pos";
const CLOUD_URI = process.env.CLOUD_BACKUP_URI;

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

async function runRestoreFromCloud() {
  if (!CLOUD_URI || CLOUD_URI.trim() === "") {
    return { ok: false, reason: "not-configured" };
  }

  const localDb = dbNameFromUri(LOCAL_URI) || "tableturn-pos";
  const cloudDb = dbNameFromUri(CLOUD_URI);
  if (!cloudDb) {
    return { ok: false, reason: "invalid-cloud-db-name" };
  }

  const mongodumpCmd = resolveTool("mongodump");
  const mongorestoreCmd = resolveTool("mongorestore");
  if (!mongodumpCmd || !mongorestoreCmd) {
    return { ok: false, reason: "tools-missing" };
  }

  const tmpDir = path.join(os.tmpdir(), `pos-restore-${Date.now()}`);

  try {
    execSync(
      `${mongodumpCmd} --uri="${CLOUD_URI}" --excludeCollection=licenses --out="${tmpDir}"`,
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const dumpDbDir = path.join(tmpDir, cloudDb);

    const restoreCmd =
      `${mongorestoreCmd} --uri="${LOCAL_URI}" --drop ` +
      `--nsFrom="${cloudDb}.*" --nsTo="${localDb}.*" "${dumpDbDir}"`;
    execSync(restoreCmd, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5 * 60 * 1000,
    });

    return { ok: true, localDb, cloudDb };
  } catch (err) {
    const detail = (err.stderr ? err.stderr.toString() : err.message || "")
      .split("\n")
      .slice(0, 3)
      .join(" | ");
    return { ok: false, reason: "restore-failed", detail };
  } finally {
    try {
      if (fs.existsSync(tmpDir))
        fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function cliMain() {
  if (!CLOUD_URI || CLOUD_URI.trim() === "") {
    console.log(
      "❌ CLOUD_BACKUP_URI .env.local mein set nahi hai. Pehle wo set karein.",
    );
    process.exit(1);
  }
  const localDb = dbNameFromUri(LOCAL_URI) || "tableturn-pos";
  const cloudDb = dbNameFromUri(CLOUD_URI);

  console.log(
    "\n⚠️  Yeh operation Local Database ko Atlas ke backup se OVERWRITE kar dega.",
  );
  console.log(
    `   Cloud database: "${cloudDb}"  ->  Local database: "${localDb}"`,
  );
  const confirm = await ask(
    "Confirm karne ke liye 'HAAN' likhein aur Enter dabayen: ",
  );
  if (confirm.trim().toUpperCase() !== "HAAN") {
    console.log("Cancel kar diya gaya. Kuch change nahi hua.");
    process.exit(0);
  }

  console.log(
    `\n📥 Atlas (cloud) se "${cloudDb}" database download ho raha hai...`,
  );
  const result = await runRestoreFromCloud();
  if (result.ok) {
    console.log(
      `\n✅ Mukammal! Local Database ("${result.localDb}") ab Atlas ke latest backup jaisi hai.`,
    );
    console.log(
      "   Ab app dobara start karein (npm run start:lan ya .exe kholain).\n",
    );
  } else {
    console.error(
      `\n❌ Restore fail ho gaya: ${result.reason} ${result.detail || ""}\n`,
    );
    process.exit(1);
  }
}

if (require.main === module) {
  cliMain();
}

module.exports = { runRestoreFromCloud };
