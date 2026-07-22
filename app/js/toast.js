export function showToast(message, { duration = 2600 } = {}) {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  }

  const el = document.createElement("div");
  el.className = "toast glass";
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => {
    el.style.transition = "opacity 0.25s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 250);
  }, duration);
}
