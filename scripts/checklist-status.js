// 統計 data/format-checklist.json 未完成項(CLAUDE.md「更新進度」步驟5用)。純讀取,不寫檔。
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const checklistPath = path.join(root, "data", "format-checklist.json");

const sections = JSON.parse(fs.readFileSync(checklistPath, "utf8"));

let totalCount = 0;
let totalChecked = 0;

console.log("論文格式檢核表完成狀況:\n");

for (const section of sections) {
  const items = section.items;
  const checkedCount = items.filter((it) => it.checked).length;
  totalCount += items.length;
  totalChecked += checkedCount;

  console.log(`§${section.sectionId} ${section.sectionTitle}(${checkedCount}/${items.length})`);
  for (const it of items) {
    if (!it.checked) console.log(`  [ ] ${it.id} ${it.label}`);
  }
}

const pct = totalCount ? Math.round((totalChecked / totalCount) * 100) : 0;
console.log(`\n總計:${totalChecked}/${totalCount}(${pct}%)`);
