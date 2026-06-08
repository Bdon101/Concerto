import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { ShareRequest } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./requests-view.css?inline";

interface RequestsVM {
  incomingRequests?: ShareRequest[];
}

export class RequestsViewElement extends HTMLElement {
  viewModel = createViewModel<RequestsVM>({}).with(
    fromStore<Model>(this),
    "incomingRequests"
  );

  view = html`
    ${($: RequestsVM) => {
      const requests = $.incomingRequests;

      return html`
        <a class="back-link" href="/app">← All concerts</a>
        <h1>Friend requests</h1>

        ${!requests
          ? html`<p class="status">Loading…</p>`
          : requests.length === 0
          ? html`<p class="status">No pending requests.</p>`
          : html`
              <ul class="request-list">
                ${requests.map(
                  (r: ShareRequest) => html`
                    <li class="request-row">
                      <div class="request-info">
                        <span class="from">${r.fromUsername}</span>
                        <span class="detail">
                          wants to share “${r.showTitle}” with you
                        </span>
                      </div>
                      <div class="request-actions">
                        <button
                          type="button"
                          class="accept"
                          data-action="accept"
                          data-id=${r.id}
                        >Accept</button>
                        <button
                          type="button"
                          class="decline"
                          data-action="decline"
                          data-id=${r.id}
                        >Decline</button>
                      </div>
                    </li>
                  `
                )}
              </ul>
            `}
      `;
    }}
  `;

  constructor() {
    super();
    shadow(this)
      .styles(RequestsViewElement.styles)
      .replace(this.viewModel.render(this.view))
      .listen({
        click: (ev: Event) => this.handleClick(ev)
      });
  }

  connectedCallback() {
    setTimeout(() => Store.dispatch(this, ["shareRequests/request"]), 0);
  }

  private handleClick(ev: Event) {
    const btn = (ev.target as HTMLElement).closest(
      "[data-action]"
    ) as HTMLElement | null;
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id || (action !== "accept" && action !== "decline")) return;

    btn.parentElement
      ?.querySelectorAll("button")
      .forEach((b) => ((b as HTMLButtonElement).disabled = true));

    Store.dispatch(this, [
      "shareRequest/respond",
      { id, action },
      {
        onFailure: () => {
          btn.parentElement
            ?.querySelectorAll("button")
            .forEach((b) => ((b as HTMLButtonElement).disabled = false));
        }
      }
    ]);
  }

  static styles = css`${rawStyles}`;
}
