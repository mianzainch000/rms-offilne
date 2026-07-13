const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const SRC_DIR = path.join(__dirname, "..", "electron-src");
const OUT_DIR = path.join(__dirname, "..", "electron");

const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: "hexadecimal",
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

function clean(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function processDir(srcDir, outDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const outPath = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(outPath, { recursive: true });
      processDir(srcPath, outPath);
    } else if (entry.name.endsWith(".js")) {
      const code = fs.readFileSync(srcPath, "utf-8");
      const obfuscated = JavaScriptObfuscator.obfuscate(
        code,
        OBFUSCATION_OPTIONS,
      ).getObfuscatedCode();
      fs.writeFileSync(outPath, obfuscated, "utf-8");
      console.log(`  🔒 obfuscated: electron/${entry.name}`);
    } else {
      fs.copyFileSync(srcPath, outPath);
      console.log(`  📄 copied:     electron/${entry.name}`);
    }
  }
}

console.log(
  "\n🔒 Electron source obfuscate ho raha hai (electron-src -> electron)...\n",
);
clean(OUT_DIR);
processDir(SRC_DIR, OUT_DIR);
console.log(
  "\n✅ Mukammal — 'electron/' folder ab obfuscated/build version hai, isay .exe mein pack kiya jayega.\n",
);
