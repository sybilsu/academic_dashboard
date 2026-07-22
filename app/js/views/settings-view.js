import { loadAll, invalidate } from "../data.js";
import { state } from "../state.js";
import { showToast } from "../toast.js";

function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export class SettingsView extends HTMLElement {
  connectedCallback() {
    this.classList.add("view");
  }

  async onActivate() {
    this.renderContent();
  }

  renderContent() {
    const demoMode = state.getDemoMode();
    const pat = state.getPat();
    const theme = state.getTheme();
    const pending = state.getPendingInboxLines();

    this.innerHTML = `
      <h1 class="page-title">設定</h1>

      <div class="settings-group">
        <glass-card class="card">
          <div class="toggle-row">
            <div>
              <div class="card-title">Demo 模式</div>
              <div class="card-sub">改讀 data/demo/ 展示資料,不動真實進度</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="demo-toggle" ${demoMode ? "checked" : ""} />
              <span class="track"></span>
              <span class="thumb"></span>
            </label>
          </div>
        </glass-card>

        <glass-card class="card">
          <div class="card-title">外觀</div>
          <div class="card-row" style="gap: var(--space-2); flex-wrap: wrap;">
            <button type="button" class="btn ${theme === "auto" ? "btn-primary" : "btn-ghost"}" data-theme="auto">跟隨系統</button>
            <button type="button" class="btn ${theme === "light" ? "btn-primary" : "btn-ghost"}" data-theme="light">淺色</button>
            <button type="button" class="btn ${theme === "dark" ? "btn-primary" : "btn-ghost"}" data-theme="dark">深色</button>
          </div>
        </glass-card>

        <glass-card class="card">
          <div class="card-title">GitHub Personal Access Token</div>
          <div class="card-sub">尚未接上寫入功能(規劃於 M3):手機/桌面直接 commit 進度到 repo。這裡先讓你預先儲存,之後 M3 完成即可直接使用。</div>
          <div class="field">
            <label for="pat-input">Fine-grained PAT(只授權此 repo 的 Contents 讀寫)</label>
            <input type="password" id="pat-input" class="text-input" placeholder="github_pat_…" value="${pat}" />
          </div>
          <button type="button" class="btn btn-primary" id="pat-save" style="align-self: flex-start;">儲存</button>
        </glass-card>

        <glass-card class="card">
          <div class="card-title">本機待同步輸入</div>
          <div class="card-sub">「今天」頁快速輸入的內容,目前只存在這台裝置的瀏覽器,尚未寫回 inbox.md</div>
          ${
            pending.length
              ? `<div class="pending-list">
                  ${pending
                    .map(
                      (p) => `<div class="pending-row"><span>${p.text}</span><span class="card-meta">${fmtDateTime(p.ts)}</span></div>`
                    )
                    .join("")}
                </div>
                <button type="button" class="btn btn-ghost" id="clear-pending" style="align-self: flex-start;">清除本機紀錄</button>`
              : `<p class="empty-state">目前沒有待同步的輸入</p>`
          }
        </glass-card>

        <glass-card class="card">
          <div class="card-title">資料匯出</div>
          <div class="card-sub">下載目前載入的資料(依 Demo 模式開關決定來源)為單一 JSON 檔</div>
          <button type="button" class="btn btn-ghost" id="export-data" style="align-self: flex-start;">匯出 JSON</button>
        </glass-card>
      </div>
    `;

    this.bind();
  }

  bind() {
    this.querySelector("#demo-toggle").addEventListener("change", (e) => {
      state.setDemoMode(e.target.checked);
      invalidate();
      this.renderContent();
      showToast(e.target.checked ? "已切換到 Demo 模式" : "已切回真實資料");
    });

    this.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.setTheme(btn.dataset.theme);
        this.renderContent();
      });
    });

    this.querySelector("#pat-save").addEventListener("click", () => {
      const val = this.querySelector("#pat-input").value.trim();
      state.setPat(val);
      showToast("已儲存在本機瀏覽器(M3 完成前不會被使用)");
    });

    const clearBtn = this.querySelector("#clear-pending");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        state.clearPendingInboxLines();
        this.renderContent();
      });
    }

    this.querySelector("#export-data").addEventListener("click", async () => {
      const data = await loadAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trellis-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

customElements.define("settings-view", SettingsView);
