const SVG_NS = "http://www.w3.org/2000/svg";

export class ProgressRing extends HTMLElement {
  static get observedAttributes() {
    return ["value", "status", "size"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const value = Math.max(0, Math.min(100, Number(this.getAttribute("value")) || 0));
    const status = this.getAttribute("status") || "in_progress";
    const size = Number(this.getAttribute("size")) || 64;
    const stroke = Math.max(4, Math.round(size * 0.1));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - value / 100);

    this.innerHTML = "";
    const wrap = document.createElement("span");
    wrap.className = "ring-wrap";
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.transform = "rotate(-90deg)";

    const track = document.createElementNS(SVG_NS, "circle");
    track.setAttribute("cx", size / 2);
    track.setAttribute("cy", size / 2);
    track.setAttribute("r", r);
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", "currentColor");
    track.setAttribute("stroke-opacity", "0.14");
    track.setAttribute("stroke-width", stroke);

    const fill = document.createElementNS(SVG_NS, "circle");
    fill.setAttribute("cx", size / 2);
    fill.setAttribute("cy", size / 2);
    fill.setAttribute("r", r);
    fill.setAttribute("fill", "none");
    fill.setAttribute("stroke", `var(--status-${status}, var(--accent))`);
    fill.setAttribute("stroke-width", stroke);
    fill.setAttribute("stroke-linecap", "round");
    fill.setAttribute("stroke-dasharray", `${c} ${c}`);
    fill.setAttribute("stroke-dashoffset", String(offset));
    fill.style.transition = "stroke-dashoffset 0.4s ease";

    svg.append(track, fill);
    wrap.appendChild(svg);

    if (this.hasAttribute("show-value")) {
      const label = document.createElement("span");
      label.className = "ring-value";
      label.textContent = `${value}%`;
      wrap.appendChild(label);
    }

    this.appendChild(wrap);
  }
}

customElements.define("progress-ring", ProgressRing);
