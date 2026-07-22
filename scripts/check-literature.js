// 引用一致性檢查(PRD.md §5.3):已引用文獻是否都有附錄摘錄檔案。
// 只跑在 data/literature.json(真實資料),不動 data/demo/literature.json。
// 只能檢查「檔案存不存在」這種結構性問題;摘錄原文與引用意圖是否一致屬語意判斷,
// 仍需在「更新進度」流程中人工/Claude Code 複核。
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const litPath = path.join(root, "data", "literature.json");

const literature = JSON.parse(fs.readFileSync(litPath, "utf8"));

let changed = false;
const warnings = [];

for (const item of literature) {
  const prev = item.consistencyCheck;

  if (item.status === "已引用") {
    const hasPath = !!item.appendixQuotePath;
    const fileExists = hasPath && fs.existsSync(path.join(root, item.appendixQuotePath));
    item.consistencyCheck = fileExists ? "ok" : "missing_appendix";
    if (!fileExists) {
      warnings.push(
        `✗ ${item.citekey}:狀態為「已引用」但找不到附錄摘錄檔案(${
          item.appendixQuotePath || "appendixQuotePath 未設定"
        })`
      );
    } else {
      warnings.push(`○ ${item.citekey}:附錄摘錄檔案存在(結構通過),語意一致性仍需人工複核`);
    }
  } else if (item.consistencyCheck !== "not_applicable") {
    item.consistencyCheck = "not_applicable";
  }

  if (item.consistencyCheck !== prev) changed = true;

  if (item.notePath && !fs.existsSync(path.join(root, item.notePath))) {
    warnings.push(`△ ${item.citekey}:notePath 已設定但檔案不存在(${item.notePath})`);
  }
}

if (changed) {
  fs.writeFileSync(litPath, JSON.stringify(literature, null, 2) + "\n");
}

console.log(`引用一致性檢查(${literature.length} 篇文獻):`);
if (warnings.length) {
  for (const w of warnings) console.log(`  ${w}`);
} else {
  console.log("  (無文獻資料)");
}
console.log(changed ? "\n已更新 data/literature.json 的 consistencyCheck 欄位。" : "\n無變動。");
