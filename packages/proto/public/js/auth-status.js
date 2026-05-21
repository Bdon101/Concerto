import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";
import reset from "./styles/reset.css.js";

export class AuthStatusElement extends HTMLElement {
  viewModel = createViewModel({
    authenticated: false,
    username: ""
  }).with(fromAuth(this), "authenticated", "username");

  view = html`
    <span
      class=${($) => ($.authenticated ? "logged-in" : "logged-out")}
    >
      <span class="when-signed-in">
        Hello, ${($) => $.username || "user"} ·
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
    button {
      background: transparent;
      border: none;
      color: var(--color-link);
      cursor: pointer;
      font: inherit;
      text-decoration: underline;
      padding: 0;
    }
    a {
      color: var(--color-link);
    }
  `;

  constructor() {
    super();
    shadow(this)
      .styles(reset.styles, AuthStatusElement.styles)
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
