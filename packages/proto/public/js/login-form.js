import { css, html, shadow } from "@unbndl/html";
import { createViewModel, fromInputs } from "@unbndl/view";
import reset from "./styles/reset.css.js";

export class LoginFormElement extends HTMLElement {
  viewModel = createViewModel({
    username: "",
    password: ""
  }).with(fromInputs(this), "username", "password");

  view = html`
    <form>
      <slot></slot>
      <button type="submit">
        <slot name="submit-label">Login</slot>
      </button>
      <p class="error" data-error></p>
    </form>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(reset.styles, LoginFormElement.styles)
      .replace(this.viewModel.render(this.view))
      .listen("submit", (ev) =>
        this.submitLogin(ev, this.getAttribute("api") || "#")
      );
  }

  submitLogin(event, endpoint) {
    event.preventDefault();
    const data = this.viewModel.toObject();
    const errEl = this.shadowRoot?.querySelector("[data-error]");
    if (errEl) errEl.textContent = "";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(`Sign-in failed (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then(({ token }) => {
        this.dispatchEvent(
          new CustomEvent("auth:message", {
            bubbles: true,
            composed: true,
            detail: ["auth/signin", { token, redirect: "/" }]
          })
        );
      })
      .catch((err) => {
        console.error(err);
        if (errEl) errEl.textContent = err.message || String(err);
      });
  }

  static styles = css`
    form {
      display: grid;
      gap: var(--space-3);
    }
    ::slotted(label) {
      display: grid;
      gap: var(--space-1);
    }
    button {
      justify-self: start;
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: inherit;
      font: inherit;
      cursor: pointer;
      border-radius: var(--radius-card);
    }
    .error {
      color: #b00020;
      min-height: 1.2em;
      font-size: 0.9rem;
    }
    .error:empty {
      display: none;
    }
  `;
}
