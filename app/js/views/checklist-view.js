import { loadAll } from "../data.js";
import { state } from "../state.js";
import { syncChecklistOverrides } from "../github.js";
import { showToast } from "../toast.js";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

export class ChecklistView extends HTMLElement {
  connectedCallback() {
    this.classList.add("view");
    this.innerHTML = `<p class="empty-state">載入中…</p>`;
    this.hideChecked = false;
  }

  async onActivate() {
    try {
      this.data = await loadAll();
    } catch (err) {
      this.innerHTML = `<p class="empty-state">資料載入失敗:${err.message}</p>`;
      return;
    }
    this.renderContent();
  }

  isChecked(item) {
    const overrides = state.getChecklistOverrides();
    return overrides[item.id] !== undefined ? overrides[item.id] : item.checked;
  }

  renderContent() {
    const sections = this.data.checklist;
    let totalCount = 0;
    let totalChecked = 0;

    const sectionsHtml = sections
      .map((section) => {
        const items = section.items;
        const checkedCount = items.filter((it) => this.isChecked(it)).length;
        totalCount += items.length;
        totalChecked += checkedCount;
        const pct = items.length ? Math.round((checkedCount / items.length) * 100) : 0;
        const visibleItems = this.hideChecked ? items.filter((it) => !this.isChecked(it)) : items;

        return `
          <glass-card class="card checklist-section" data-section="${section.sectionId}">
            <div class="checklist-section-header">
              <span class="card-title">§${section.sectionId} ${escapeHtml(section.sectionTitle)}</span>
              <span class="card-meta">${checkedCount}/${items.length}</span>
            </div>
            <div class="checklist-progress-track">
              <div class="checklist-progress-fill" style="width:${pct}%;"></div>
            </div>
            <div class="checklist-items">
              ${
                visibleItems.length
                  ? visibleItems
                      .map((it) => {
                        const checked = this.isChecked(it);
                        return `<label class="check-row${checked ? " checked" : ""}">
                          <input type="checkbox" data-id="${escapeHtml(it.id)}" ${checked ? "checked" : ""} />
                          <span class="check-label">${escapeHtml(it.label)}</span>
                        </label>`;
                      })
                      .join("")
                  : `<p class="empty-state">此區已全部完成 🎉</p>`
              }
            </div>
          </glass-card>
        `;
      })
      .join("");

    const overallPct = totalCount ? Math.round((totalChecked / totalCount) * 100) : 0;

    this.innerHTML = `
      <h1 class="page-title">檢核</h1>
      <p class="page-subtitle">論文格式檢核表 · 完成率 ${overallPct}%(${totalChecked}/${totalCount})</p>
      <p class="card-meta">${
        state.getPat() && !state.getDemoMode()
          ? "勾選會直接同步回 repo 的 format-checklist.json"
          : "勾選僅存於本機(去設定頁設定 PAT 才會真正同步回 format-checklist.json)"
      }</p>

      <div class="card-row">
        <button type="button" class="btn btn-ghost" id="toggle-hide-checked">
          ${this.hideChecked ? "顯示全部項目" : "只顯示未完成項目"}
        </button>
        <button type="button" class="btn btn-ghost" id="reset-overrides">重設本機勾選</button>
      </div>

      ${sectionsHtml}
    `;

    this.querySelector("#toggle-hide-checked").addEventListener("click", () => {
      this.hideChecked = !this.hideChecked;
      this.renderContent();
    });
    this.querySelector("#reset-overrides").addEventListener("click", () => {
      state.clearChecklistOverrides();
      this.renderContent();
    });
    this.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", async () => {
        state.setChecklistOverride(cb.dataset.id, cb.checked);
        this.renderContent();

        if (state.getDemoMode()) {
          showToast("Demo 模式不會同步到 repo");
          return;
        }
        if (!state.getPat()) return;

        try {
          const { synced } = await syncChecklistOverrides({ silent: false });
          if (synced) showToast("已同步到 repo 的 format-checklist.json");
        } catch (err) {
          showToast(`同步失敗,已留在本機:${err.message}`);
        }
      });
    });
  }
}

customElements.define("checklist-view", ChecklistView);
