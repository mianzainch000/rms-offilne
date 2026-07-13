/**
 * Manage Licenses — Remote Activate/Deactivate (Owner Only, Private)
 * ---------------------------------------------------------
 * Yeh tool AAP (software owner) ke liye hai — customer ko kabhi
 * yeh file na dein.
 *
 * Kaam: Aap ke APNE (owner ke) central Atlas cluster mein ek
 * "licenses" collection maintain karta hai. Har customer ki app
 * (jab bhi internet available ho) har 5 minute mein khud is
 * collection ko check karti hai — agar status "revoked" mile,
 * app khud-ba-khud band ho jati hai. Customer ko kuch karne ki
 * zarurat NAHI — bilkul automatic hai.
 *
 * ⚠️ Zaroori: Isay chalane ke liye aapki APNI Atlas connection string
 * chahiye — wahi jo app/.env.admin mein LICENSE_DB_URI mein hai
 * (customer ki app/.env.local mein yeh KABHI nahi hoti).
 *
 * Usage:
 *   node manage-license.js
 * (interactive menu khul jayega)
 * ---------------------------------------------------------
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", "app", ".env.admin"),
});
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans.trim())));
}

let ATLAS_URI = process.env.LICENSE_DB_URI || process.env.CLOUD_BACKUP_URI || "";

async function getClient() {
  const { MongoClient } = require("mongodb");
  if (!ATLAS_URI) {
    ATLAS_URI = await ask(
      "\nAapki apni Atlas connection string paste karein (LICENSE_DB_URI, customer ki CLOUD_BACKUP_URI nahi): "
    );
  }
  const client = new MongoClient(ATLAS_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  return client;
}

async function setStatus(computerId, status) {
  const client = await getClient();
  try {
    const db = client.db();
    await db
      .collection("licenses")
      .updateOne(
        { computerId },
        { $set: { computerId, status, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    console.log(`\n✅ "${computerId}" ab "${status === "revoked" ? "DEACTIVATED ⛔" : "ACTIVE ✅"}" hai.`);
    console.log("   Customer ki app agli baar internet milte hi (5 minute ke andar) khud update ho jayegi.\n");
  } finally {
    await client.close();
  }
}

async function listAll() {
  const client = await getClient();
  try {
    const db = client.db();
    const docs = await db.collection("licenses").find({}).toArray();
    if (docs.length === 0) {
      console.log("\n(Abhi tak koi record nahi hai)\n");
      return;
    }
    console.log("\n--- Sab Customers ---");
    docs.forEach((d) => {
      const badge = d.status === "revoked" ? "⛔ DEACTIVATED" : "✅ ACTIVE";
      console.log(`  ${badge}   ${d.computerId}   (updated: ${d.updatedAt || "-"})`);
    });
    console.log("");
  } finally {
    await client.close();
  }
}

async function mainMenu() {
  console.log("\n========== NENO POS — License Manager (Private) ==========");
  console.log("1) Customer Deactivate Karein (⛔ non-payment / masla)");
  console.log("2) Customer Reactivate Karein (✅ payment mil gayi)");
  console.log("3) Sab Customers Ki List Dekhein");
  console.log("4) Exit");
  const choice = await ask("\nOption number likhein: ");

  if (choice === "1") {
    const id = await ask("Computer ID (customer se WhatsApp par li hui): ");
    await setStatus(id.trim().toUpperCase(), "revoked");
  } else if (choice === "2") {
    const id = await ask("Computer ID: ");
    await setStatus(id.trim().toUpperCase(), "active");
  } else if (choice === "3") {
    await listAll();
  } else {
    rl.close();
    process.exit(0);
  }

  await mainMenu();
}

mainMenu().catch((err) => {
  console.error("\n❌ Error:", err.message);
  console.error("   Check karein: internet chal raha hai, aur Atlas connection string sahi hai.\n");
  process.exit(1);
});
