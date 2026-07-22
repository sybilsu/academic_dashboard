export class GlassCard extends HTMLElement {
  connectedCallback() {
    this.classList.add("glass", "card");
  }
}

customElements.define("glass-card", GlassCard);
