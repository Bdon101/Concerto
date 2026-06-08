// Wires the header dark-mode switch. The initial class is applied by an
// inline script in index.html (before paint, to avoid a flash); this just
// syncs the toggle's checked state and persists changes to localStorage.
const STORAGE_KEY = "concerto:dark-mode";

function init() {
  const toggle = document.querySelector("[data-dark-toggle]");
  if (!toggle) return;

  toggle.checked = document.body.classList.contains("dark-mode");

  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", toggle.checked);
    try {
      localStorage.setItem(STORAGE_KEY, String(toggle.checked));
    } catch {
      // localStorage unavailable (private mode); preference just won't persist.
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
