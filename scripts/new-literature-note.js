// 依 PRD.md §5.2 模板建立文獻筆記檔:node scripts/new-literature-note.js <citekey> "<title>"
const fs = require("fs");
const path = require("path");

const [, , citekey, title] = process.argv;

if (!citekey) {
  console.error('用法:node scripts/new-literature-note.js <citekey> "<title>"');
  process.exit(1);
}

const root = path.join(__dirname, "..");
const notePath = path.join(root, "notes", "literature", `${citekey}.md`);

if (fs.existsSync(notePath)) {
  console.error(`✗ ${path.relative(root, notePath)} 已存在,不覆蓋。`);
  process.exit(1);
}

const template = `# ${title || citekey}

- citekey: ${citekey}
- 狀態:待讀

## A. 摘要層(≤200 字,回答三問)
1. 這篇論文的研究問題是什麼?
2. 這個問題用什麼樣的方法來解決或驗證?
3. 用這個方法解決後,最後得到什麼結果?

## B. 詳細層(標註對應 IMRD 段落)
1. 研究目的為何?(I)
2. 研究問題為何?(I)
3. 研究問題的背景為何?過去如何解決?引用哪些理論?(I)
4. 主要研究假設與研究架構為何?(M)
5. 作者如何抽樣與獲得資料?(M)
6. 主要變項為何(獨變項、依變項、控制變項)?(M)
7. 使用了哪些統計方法?(M)
8. 有多少重要發現?(R)
9. 結果有何限制?如何應用?(D)
10. 我對這篇論文整體的評論?

## C. 引用意圖
- 打算在論文哪一節引用:
- 引用原因:
`;

fs.mkdirSync(path.dirname(notePath), { recursive: true });
fs.writeFileSync(notePath, template);
console.log(`✓ 已建立 ${path.relative(root, notePath)}`);
