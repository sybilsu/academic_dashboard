import { loadAll, recentActivity } from "../data.js";
import { state } from "../state.js";
import { showToast } from "../toast.js";

const STATUS_LABEL = {
  not_started: "未開始",
  in_progress: "進行中",
  behind: "落後",
  done: "已完成",
};

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export class TodayView extends HTMLElement {
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
    this.renderContent(data);
    this.bindQuickInput();
  }

  renderContent(data) {
    const now = new Date();
    const today = startOfDay(now);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const behindProjects = data.projects.filter((p) => p.status === "behind");

    const weekTasks = data.tasks.filter((t) => {
      if (t.status === "done") return false;
      if (t.status === "in_progress") return true;
      if (!t.dueDate) return false;
      const due = startOfDay(t.dueDate);
      return due <= weekEnd;
    });

    const activity = recentActivity(data, 6);

    this.innerHTML = `
      <h1 class="page-title">今天</h1>
      <p class="page-subtitle">${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}</p>

      ${
        behindProjects.length
          ? `<glass-card class="card" style="border-color: color-mix(in srgb, var(--status-behind) 45%, var(--glass-border));">
              <div class="section-title" style="color: var(--status-behind);">落後警示</div>
              <div class="task-list">
                ${behindProjects
                  .map(
                    (p) => `<div class="card-row">
                      <span class="card-title">${p.name}</span>
                      <span class="badge badge-behind">落後 · ${p.progress}%</span>
                    </div>`
                  )
                  .join("")}
              </div>
            </glass-card>`
          : ""
      }

      <div class="section-title">最近更新</div>
      <glass-card class="card">
        ${
          activity.length
            ? `<div class="activity-list">
                ${activity
                  .map(
                    (a) => `<div class="activity-row">
                      <span class="activity-date">${fmtDate(a.ts)}</span>
                      <span>${a.icon} ${a.text}</span>
                    </div>`
                  )
                  .join("")}
              </div>`
            : `<p class="empty-state">還沒有更新紀錄</p>`
        }
      </glass-card>

      <div class="section-title">本週任務</div>
      <glass-card class="card">
        ${
          weekTasks.length
            ? `<div class="task-list">
                ${weekTasks
                  .map(
                    (t) => `<div class="task-row">
                      <span class="badge badge-${t.status}">${
                      t.status === "in_progress" ? "進行中" : "待辦"
                    }</span>
                      <span class="task-title">${t.title}</span>
                      ${t.dueDate ? `<span class="task-due">${fmtDate(t.dueDate)}</span>` : ""}
                    </div>`
                  )
                  .join("")}
              </div>`
            : `<p class="empty-state">本週沒有排定任務</p>`
        }
      </glass-card>

      <div class="section-title">專案進度</div>
      <glass-card class="card">
        <div class="rings-grid">
          ${data.projects
            .map(
              (p) => `<div class="ring-tile">
                <progress-ring value="${p.progress}" status="${p.status}" size="64" show-value></progress-ring>
                <span class="ring-label">${p.id} · ${STATUS_LABEL[p.status]}</span>
              </div>`
            )
            .join("")}
        </div>
      </glass-card>

      <div class="quick-input-bar glass">
        <input type="text" id="quick-input" placeholder="輸入一句進度…例如「倫理課程上完第3章」" />
        <button type="button" class="btn btn-primary" id="quick-send">送出</button>
      </div>
    `;
  }

  bindQuickInput() {
    const input = this.querySelector("#quick-input");
    const send = this.querySelector("#quick-send");
    if (!input || !send) return;

    const submit = () => {
      const text = input.value.trim();
      if (!text) return;
      state.addPendingInboxLine(text);
      input.value = "";
      showToast("已記錄在本機,尚未同步到 repo(需先在設定頁完成 M3 PAT 設定)");
    };

    send.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  }
}

customElements.define("today-view", TodayView);
