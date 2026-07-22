# Trellis — Claude Code 自動化規則

本檔案供 Claude Code 在此 repo 內工作時遵循。完整產品需求見 `PRD.md`。

## 資料 schema
所有 `data/*.json` 與 `data/demo/*.json` 必須符合 `data/schemas/*.schema.json`。
修改任何 data 檔案後,執行 `npm run validate` 確認通過。

## 觸發:「更新進度」

使用者在筆電對 Claude Code 說「更新進度」或直接鍵入新進度時,依序執行:

0. **同步**:先 `git pull`。手機端(見 M3)可能已經透過 GitHub API 直接 commit 過
   `inbox/inbox.md` 或 `data/format-checklist.json`,桌面端要先拉最新的才不會讀到過期
   內容、或覆蓋掉手機端的更新。
1. **收件**:讀 `inbox/inbox.md` 全部未處理行。
2. **解析**:判斷每行屬於哪個專案(`data/projects.json`)/任務(`data/tasks.json`)/
   文獻(`data/literature.json`)/書(`data/books.json`),更新對應 JSON
   (勾完成、寫進度百分比、補時間戳)。
3. **建檔**:新文獻 → 執行 `node scripts/new-literature-note.js <citekey> "<title>"`
   依 `PRD.md` §5.2 模板在 `notes/literature/<citekey>.md` 建檔;
   新引用 → 提醒補 `notes/appendix-quotes/<citekey>.md`。
4. **重算時程**:依完成狀況更新 `data/milestones.json` 雙軌看板的落後警示(剩餘天數由
   PWA 時間軸頁即時計算,不存進 JSON);落後項目列入「今天」頁置頂。
5. **檢查**:執行 `npm run check`,一次涵蓋:
   - `scripts/validate-schemas.js`:所有 JSON 仍符合 schema。
   - `scripts/check-literature.js`:§5.3 引用一致性檢查(已引用文獻是否都有附錄摘錄
     檔案),結果寫回 `literature.json` 的 `consistencyCheck` 欄位。摘錄原文與「引用
     意圖」是否語意一致,腳本判斷不了,人工複核。
   - `scripts/checklist-status.js`:統計 `format-checklist.json` 未完成項。
6. **清空 inbox、commit、push** → GitHub Pages 自動部署 → 手機重新整理即見最新狀態。

## Commit message 慣例
- `progress: <摘要>`
- `lit: <citekey>`
- `checklist: <項目>`

## 明確不做
不做帳號系統、不做多人協作、不做原生 app、不做推播伺服器、不做後端(見 PRD.md §2.3)。
