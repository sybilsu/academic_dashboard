import { loadAll, fetchNote } from "../data.js";

const COLUMNS = ["待讀", "已寫摘要", "已詳讀", "已引用"];

const CHECK_LABEL = {
  ok: "一致",
  missing_appendix: "缺附錄摘錄",
  mismatch: "摘錄不一致",
  not_applicable: "—",
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

export class LiteratureView extends HTMLElement {
  connectedCallback() {
    this.classList.add("view");
    this.innerHTML = `<p class="empty-state">載入中…</p>`;
  }

  async onActivate() {
    let data;
    try {
      data = await loadAll();
    } catch (err) {
      this.innerHTML = `<p class="empty-state">資料載入失敗:${err.message}</p>`;
      return;
    }
    this.data = data;
    this.renderContent(data);
  }

  renderContent(data) {
    const byStatus = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    for (const item of data.literature) {
      (byStatus[item.status] || (byStatus[item.status] = [])).push(item);
    }

    this.innerHTML = `
      <h1 class="page-title">文獻</h1>
      <p class="page-subtitle">${data.literature.length} 篇 · 狀態機:待讀 → 已寫摘要 → 已詳讀 → 已引用</p>

      <div class="kanban">
        ${COLUMNS.map((col) => {
          const items = byStatus[col] || [];
          return `
            <div class="kanban-col">
              <div class="kanban-col-header">
                <span class="kanban-dot" style="background: var(--lit-${col});"></span>
                <span>${col}</span>
                <span class="kanban-count">${items.length}</span>
              </div>
              <div class="kanban-cards">
                ${
                  items.length
                    ? items
                        .map(
                          (it) => `<button type="button" class="lit-card glass" data-citekey="${escapeHtml(it.citekey)}">
                            <span class="lit-title">${escapeHtml(it.title)}</span>
                            <span class="lit-meta">${escapeHtml(it.authors || "")}${it.year ? ` · ${it.year}` : ""}</span>
                            ${
                              it.status === "已引用"
                                ? `<span class="badge badge-${it.consistencyCheck}">${CHECK_LABEL[it.consistencyCheck]}</span>`
                                : ""
                            }
                          </button>`
                        )
                        .join("")
                    : `<p class="empty-state">尚無</p>`
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    this.querySelectorAll(".lit-card").forEach((card) => {
      card.addEventListener("click", () => this.openDetail(card.dataset.citekey));
    });
  }

  async openDetail(citekey) {
    const item = this.data.literature.find((l) => l.citekey === citekey);
    if (!item) return;

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-sheet glass">
        <button type="button" class="btn btn-ghost modal-close">關閉 ✕</button>
        <h2 class="card-title">${escapeHtml(item.title)}</h2>
        <p class="card-sub">${escapeHtml(item.authors || "")}${item.year ? ` · ${item.year}` : ""} · citekey: ${escapeHtml(item.citekey)}</p>
        <p class="card-meta">狀態:${item.status}${item.citedInSection ? ` · 引用於:${escapeHtml(item.citedInSection)}` : ""}</p>
        <div class="section-title">筆記內容</div>
        <pre id="note-body">載入中…</pre>
      </div>
    `;
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.remove();
    });
    backdrop.querySelector(".modal-close").addEventListener("click", () => backdrop.remove());
    document.body.appendChild(backdrop);

    const text = await fetchNote(item.notePath);
    backdrop.querySelector("#note-body").textContent = text || "尚未建檔(notes/literature/ 尚無此檔案)";
  }
}

customElements.define("literature-view", LiteratureView);
