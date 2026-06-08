import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";
import { Store, fromStore } from "@unbndl/store";
import { ShareRequest } from "server/models";
import { Model } from "../model.ts";

interface AuthVM {
  authenticated: boolean;
  username: string;
  incomingRequests?: ShareRequest[];
}

export class AuthStatusElement extends HTMLElement {
  viewModel = createViewModel<AuthVM>({
    authenticated: false,
    username: ""
  })
    .with(fromAuth(this), "authenticated", "username")
    .with(fromStore<Model>(this), "incomingRequests");

  view = html`
    <span
      class=${($: AuthVM) => ($.authenticated ? "logged-in" : "logged-out")}
    >
      <span class="when-signed-in">
        Hello, ${($: AuthVM) => $.username || "user"} ·
        <a class="requests-link" href="/app/requests"
          >Requests${($: AuthVM) => {
            const count = $.incomingRequests?.length ?? 0;
            return count > 0 ? html`<span class="badge">${count}</span>` : html``;
          }}</a
        >
        ·
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
    .badge {
      display: inline-block;
      min-width: 1.1em;
      margin-left: 4px;
      padding: 0 5px;
      border-radius: 999px;
      background: var(--color-accent);
      color: var(--color-text-inverted);
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1.4;
      text-align: center;
      vertical-align: baseline;
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

  connectedCallback() {
    // Load the pending-request count so the header badge reflects waiting
    // invites as soon as the app shell mounts.
    setTimeout(() => Store.dispatch(this, ["shareRequests/request"]), 0);
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
