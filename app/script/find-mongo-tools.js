const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function isInPath(command) {
  try {
    const checkCmd =
      process.platform === "win32" ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function searchCommonWindowsLocations(exeName) {
  const candidates = [
    "C:\\Program Files\\MongoDB\\Tools",
    "C:\\Program Files\\mongodb-database-tools",
    "C:\\Program Files (x86)\\MongoDB\\Tools",
  ];

  for (const baseDir of candidates) {
    if (!fs.existsSync(baseDir)) continue;

    const directBin = path.join(baseDir, "bin", exeName);
    if (fs.existsSync(directBin)) return directBin;

    try {
      const subDirs = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((d) => d.isDirectory());
      for (const sub of subDirs) {
        const nestedBin = path.join(baseDir, sub.name, "bin", exeName);
        if (fs.existsSync(nestedBin)) return nestedBin;
      }
    } catch {}
  }
  return null;
}

function resolveTool(toolName) {
  if (isInPath(toolName)) return toolName;

  const exeName = process.platform === "win32" ? `${toolName}.exe` : toolName;
  const found =
    process.platform === "win32" ? searchCommonWindowsLocations(exeName) : null;

  if (found) return `"${found}"`;

  return null;
}

module.exports = { resolveTool };
