# Trellis — Claude Code 自動化規則

本檔案供 Claude Code 在此 repo 內工作時遵循。完整產品需求見 `PRD.md`。

## 資料 schema
所有 `data/*.json` 與 `data/demo/*.json` 必須符合 `data/schemas/*.schema.json`。
修改任何 data 檔案後,執行 `npm run validate` 確認通過。

## 觸發:「更新進度」

使用者在筆電對 Claude Code 說「更新進度」或直接鍵入新進度時,依序執行:

1. **收件**:讀 `inbox/inbox.md` 全部未處理行。
2. **解析**:判斷每行屬於哪個專案(`data/projects.json`)/任務(`data/tasks.json`)/
   文獻(`data/literature.json`)/書(`data/books.json`),更新對應 JSON
   (勾完成、寫進度百分比、補時間戳)。
3. **建檔**:新文獻 → 依 `PRD.md` §5.2 模板在 `notes/literature/<citekey>.md` 建檔;
   新引用 → 提醒補 `notes/appendix-quotes/<citekey>.md`。
4. **重算時程**:依完成狀況更新 `data/milestones.json` 雙軌看板的剩餘天數與落後警示;
   落後項目列入「今天」頁置頂。
5. **檢查**:
   - 執行 §5.3 引用一致性檢查(論文引用清單 vs 附錄摘錄一一對應、無遺漏;
     摘錄原文與「引用意圖」是否一致),結果寫回 `literature.json` 的
     `consistencyCheck` 欄位。
   - 統計 `format-checklist.json` 未完成項。
   - 執行 `npm run validate`,確保所有 JSON 仍符合 schema。
6. **清空 inbox、commit、push** → GitHub Pages 自動部署 → 手機重新整理即見最新狀態。

## Commit message 慣例
- `progress: <摘要>`
- `lit: <citekey>`
- `checklist: <項目>`

## 明確不做
不做帳號系統、不做多人協作、不做原生 app、不做推播伺服器、不做後端(見 PRD.md §2.3)。
