const major = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);

if (Number.isFinite(major) && major >= 24) {
  process.exit(0);
}

console.error("");
console.error("[sidepilot-copilot-bridge] Node.js 24+ is required.");
console.error(
  `[sidepilot-copilot-bridge] Current runtime: node ${process.versions.node}`,
);
console.error(
  "[sidepilot-copilot-bridge] In WSL/Linux, run: nvm install 24 && nvm use 24",
);
console.error(
  "[sidepilot-copilot-bridge] In Windows, install Node.js 24+ and reopen PowerShell.",
);
console.error("");
process.exit(1);
