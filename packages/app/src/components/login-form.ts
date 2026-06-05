import { css, html, shadow } from "@unbndl/html";

export class LoginFormElement extends HTMLElement {
  constructor() {
    super();
    shadow(this)
      .styles(LoginFormElement.styles)
      .replace(html`
        <form>
          <slot></slot>
          <button type="submit">
            <slot name="submit-label">Login</slot>
          </button>
          <p class="error" data-error></p>
        </form>
      `)
      .listen({
        submit: (ev: Event) =>
          this.submitLogin(ev, this.getAttribute("api") || "#")
      });
  }

  submitLogin(event: Event, endpoint: string) {
    event.preventDefault();
    const data = this.collectData();
    const errEl = this.shadowRoot?.querySelector(
      "[data-error]"
    ) as HTMLElement | null;
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
      .then(({ token }: { token: string }) => {
        this.dispatchEvent(
          new CustomEvent("auth:message", {
            bubbles: true,
            composed: true,
            detail: ["auth/signin", { token, redirect: "/app" }]
          })
        );
      })
      .catch((err: Error) => {
        console.error(err);
        if (errEl) errEl.textContent = err.message || String(err);
      });
  }

  private collectData(): Record<string, string> {
    const inputs = Array.from(this.querySelectorAll("input"));
    return Object.fromEntries(
      inputs.filter((el) => el.name).map((el) => [el.name, el.value])
    );
  }

  static styles = css`
    form {
      display: grid;
      gap: var(--space-3);
      max-width: 360px;
    }
    ::slotted(label) {
      display: grid;
      gap: var(--space-1);
    }
    button {
      justify-self: start;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      background: var(--color-background-header);
      color: var(--color-text-inverted);
      cursor: pointer;
      border-radius: var(--radius-card);
      font: inherit;
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
