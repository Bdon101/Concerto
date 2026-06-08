import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";
import { Store, fromStore } from "@unbndl/store";
import { ShareRequest } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./auth-status.css?inline";

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

  static styles = css`${rawStyles}`;

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
