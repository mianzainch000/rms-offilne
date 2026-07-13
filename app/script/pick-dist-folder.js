const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const projectDir = path.join(__dirname, "..");
const defaultDistDir = path.join(projectDir, "dist");

function pickFolderWithDialog() {
  const psCommand = `
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Installer (.exe) ko is folder mein save karein"
    $dialog.ShowNewFolderButton = $true
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      Write-Output $dialog.SelectedPath
    } else {
      Write-Output ""
    }
  `.trim();

  try {
    const result = execSync(
      `powershell -NoProfile -Command "${psCommand.replace(/"/g, '\\"')}"`,
      {
        encoding: "utf8",
      },
    );
    return result.trim();
  } catch (err) {
    return "";
  }
}

function main() {
  if (process.platform !== "win32") {
    console.log(
      "ℹ️ Folder picker sirf Windows par kaam karta hai — installer default 'dist' folder mein hi hai.",
    );
    return;
  }

  if (!fs.existsSync(defaultDistDir)) {
    console.log("⚠️ 'dist' folder nahi mila — shayad build fail ho gaya ho.");
    return;
  }

  const exeFiles = fs
    .readdirSync(defaultDistDir)
    .filter((f) => f.toLowerCase().endsWith(".exe"));

  if (!exeFiles.length) {
    console.log("⚠️ 'dist' folder mein koi .exe file nahi mili.");
    return;
  }

  console.log(
    "\n📂 Installer ban chuka hai — save karne ke liye folder choose karein (dialog khul raha hai)...",
  );
  const selectedFolder = pickFolderWithDialog();

  if (!selectedFolder) {
    console.log(
      `ℹ️ Koi folder select nahi ki gayi — installer yahin reh gaya hai:\n   ${defaultDistDir}\n`,
    );
    return;
  }

  exeFiles.forEach((file) => {
    const from = path.join(defaultDistDir, file);
    const to = path.join(selectedFolder, file);
    fs.copyFileSync(from, to);
    console.log(`✅ Copy ho gayi: ${to}`);
  });

  console.log(
    `\n🎉 Mukammal! Installer (.exe) yahan save ho gayi hai:\n   ${selectedFolder}\n`,
  );
}

main();
