import { loadAll } from "../data.js";

const RANGE_START = { year: 2026, month: 7 };
const RANGE_MONTHS = 13; // 2026/7 .. 2027/7 inclusive

function monthIndex(year, month) {
  return (year - RANGE_START.year) * 12 + (month - RANGE_START.month);
}

function parseFlexibleDate(value) {
  if (!value) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) {
    const year = +m[1],
      month = +m[2],
      day = +m[3];
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, dayFrac: day / daysInMonth };
  }
  m = /(\d{4})\/(\d{1,2})/.exec(value);
  if (m) return { year: +m[1], month: +m[2], dayFrac: 0.5 };
  return null;
}

function pctFor(value) {
  const d = parseFlexibleDate(value);
  if (!d) return null;
  const idx = monthIndex(d.year, d.month) + d.dayFrac;
  return Math.max(0, Math.min(100, (idx / RANGE_MONTHS) * 100));
}

function monthLabels() {
  const labels = [];
  for (let i = 0; i < RANGE_MONTHS; i++) {
    const total = RANGE_START.month - 1 + i;
    const year = RANGE_START.year + Math.floor(total / 12);
    const month = (total % 12) + 1;
    labels.push(`${String(year).slice(2)}/${month}`);
  }
  return labels;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function nextDeadline(track) {
  const today = startOfDay(new Date());
  const candidates = [];
  for (const n of track.nodes) {
    const raw = n.date || (n.dateRange && n.dateRange[0]);
    const d = parseFlexibleDate(raw);
    if (d) candidates.push({ label: n.label, date: new Date(d.year, d.month - 1, 1) });
  }
  candidates.sort((a, b) => a.date - b.date);
  const upcoming = candidates.find((c) => c.date >= today) || candidates[candidates.length - 1];
  if (!upcoming) return null;
  const days = Math.ceil((upcoming.date - today) / 86400000);
  return { label: upcoming.label, days };
}

function renderProjectLane(project) {
  const pct = project.deadlineDate ? pctFor(project.deadlineDate) : null;
  return `
    <div class="swimlane">
      <span class="swimlane-label">${project.id}</span>
      <div class="swimlane-track">
        ${
          pct == null
            ? ""
            : `<span class="swimlane-marker" style="left:${pct}%; background: var(--status-${project.status});" title="${project.name} · ${project.deadline}"></span>`
        }
      </div>
    </div>
  `;
}

function renderTrackLane(track, colorVar, dim) {
  const points = [];
  const ranges = [];
  for (const n of track.nodes) {
    if (n.date) {
      const pct = pctFor(n.date);
      if (pct != null) points.push({ ...n, pct });
    } else if (n.dateRange) {
      const pctStart = pctFor(n.dateRange[0]);
      const pctEnd = pctFor(n.dateRange[1]);
      if (pctStart != null && pctEnd != null) ranges.push({ ...n, pctStart, pctEnd });
    }
  }
  const allPct = [...points.map((p) => p.pct), ...ranges.flatMap((r) => [r.pctStart, r.pctEnd])];
  const spineStart = allPct.length ? Math.min(...allPct) : 0;
  const spineEnd = allPct.length ? Math.max(...allPct) : 0;

  return `
    <div class="swimlane" style="${dim ? "filter: grayscale(0.7); opacity: 0.5;" : ""}">
      <span class="swimlane-label">${track.label}</span>
      <div class="swimlane-track">
        <div class="track-line" style="left:${spineStart}%; width:${spineEnd - spineStart}%; background: color-mix(in srgb, ${colorVar} 30%, transparent);"></div>
        ${ranges
          .map(
            (r) =>
              `<div class="track-line" style="left:${r.pctStart}%; width:${r.pctEnd - r.pctStart}%; background:${colorVar}; opacity:0.6;" title="${r.label}"></div>`
          )
          .join("")}
        ${points
          .map(
            (p) =>
              `<span class="track-node status-${p.status}" style="left:${p.pct}%; background:${colorVar};" title="${p.label}(${p.date})"></span>`
          )
          .join("")}
      </div>
    </div>
  `;
}

export class TimelineView extends HTMLElement {
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
  }

  renderContent(data) {
    const ms = data.milestones;
    const jan = nextDeadline(ms.tracks.jan2027);
    const jul = nextDeadline(ms.tracks.jul2027);
    const decisionPct = pctFor(ms.decisionPoint);
    const labels = monthLabels();

    this.innerHTML = `
      <h1 class="page-title">時間軸</h1>
      <p class="page-subtitle">2026/7 → 2027/7 · 決策點:${ms.decisionPoint}</p>

      <glass-card class="card">
        <div class="card-row" style="flex-wrap: wrap; gap: var(--space-3);">
          <span class="countdown-pill" style="background: color-mix(in srgb, var(--track-jan) 18%, transparent); color: var(--track-jan);">
            ${ms.tracks.jan2027.label}${jan ? ` · 距「${jan.label}」還有 ${jan.days} 天` : ""}
          </span>
          <span class="countdown-pill" style="background: color-mix(in srgb, var(--track-jul) 18%, transparent); color: var(--track-jul);">
            ${ms.tracks.jul2027.label}${jul ? ` · 距「${jul.label}」還有 ${jul.days} 天` : ""}
          </span>
        </div>
      </glass-card>

      <glass-card class="card">
        <div class="timeline-scroll">
          <div class="timeline-grid">
            <div class="timeline-months">
              ${labels.map((l) => `<span>${l}</span>`).join("")}
            </div>

            ${
              decisionPct != null
                ? `<div class="timeline-decision-line" style="left:${decisionPct}%;">
                    <span class="timeline-decision-label">決策點</span>
                  </div>`
                : ""
            }

            <div class="swimlane-group">
              <div class="section-title">七個專案</div>
              ${data.projects.map(renderProjectLane).join("")}
            </div>

            <div class="swimlane-group" style="margin-top: var(--space-4);">
              <div class="section-title">口試雙軌</div>
              ${renderTrackLane(
                ms.tracks.jan2027,
                "var(--track-jan)",
                ms.converged && ms.convergedTrack !== "jan2027"
              )}
              ${renderTrackLane(
                ms.tracks.jul2027,
                "var(--track-jul)",
                ms.converged && ms.convergedTrack !== "jul2027"
              )}
            </div>
          </div>
        </div>

        <div class="timeline-legend">
          <span class="legend-item"><span class="legend-swatch" style="background: var(--track-jan);"></span>${ms.tracks.jan2027.label}</span>
          <span class="legend-item"><span class="legend-swatch" style="background: var(--track-jul);"></span>${ms.tracks.jul2027.label}</span>
          <span class="legend-item"><span class="legend-swatch" style="background: var(--status-behind);"></span>決策點 / 落後</span>
        </div>
      </glass-card>
    `;
  }
}

customElements.define("timeline-view", TimelineView);
