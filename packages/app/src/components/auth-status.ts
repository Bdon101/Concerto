import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";

interface AuthVM {
  authenticated: boolean;
  username: string;
}

export class AuthStatusElement extends HTMLElement {
  viewModel = createViewModel<AuthVM>({
    authenticated: false,
    username: ""
  }).with(fromAuth(this), "authenticated", "username");

  view = html`
    <span
      class=${($: AuthVM) => ($.authenticated ? "logged-in" : "logged-out")}
    >
      <span class="when-signed-in">
        Hello, ${($: AuthVM) => $.username || "user"} ·
        <button type="button" data-signout>Sign out</button>
      </span>
      <span class="when-signed-out">
        <a href="/login.html">Sign in</a>
      </span>
    </span>
  `;

  static styles = css`
    :host {
      display: inline-block;
      font-size: 0.95rem;
      color: var(--color-text-inverted);
    }
    .when-signed-in,
    .when-signed-out {
      display: none;
    }
    .logged-in .when-signed-in {
      display: inline;
    }
    .logged-out .when-signed-out {
      display: inline;
    }
    a {
      color: var(--color-text-inverted);
      text-decoration: underline;
    }
    button {
      background: transparent;
      border: none;
      cursor: pointer;
      font: inherit;
      text-decoration: underline;
      padding: 0;
      color: var(--color-text-inverted);
    }
  `;

  constructor() {
    super();
    shadow(this)
      .styles(AuthStatusElement.styles)
      .replace(this.viewModel.render(this.view))
      .delegate("[data-signout]", {
        click: () => this.signout()
      });
  }

  signout() {
    this.dispatchEvent(
      new CustomEvent("auth:message", {
        bubbles: true,
        composed: true,
        detail: ["auth/signout"]
      })
    );
  }
}
