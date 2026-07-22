import { state } from "../state.js";

export class DemoBadge extends HTMLElement {
  connectedCallback() {
    this.render();
    window.addEventListener("trellis:demo-mode-changed", () => this.render());
  }

  render() {
    this.innerHTML = state.getDemoMode()
      ? `<span class="demo-pill glass">DEMO</span>`
      : "";
  }
}

customElements.define("demo-badge", DemoBadge);
