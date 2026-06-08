import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { ShareRequest } from "server/models";
import { Model } from "../model.ts";

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

  static styles = css`
    :host {
      display: block;
      max-width: 640px;
      margin: 0 auto;
    }
    .back-link {
      display: inline-block;
      font-family: var(--font-family-body);
      font-size: 0.8125rem;
      color: var(--color-link);
      text-decoration: none;
      margin-bottom: var(--space-4);
    }
    .back-link:hover {
      text-decoration: underline;
    }
    h1 {
      font-family: var(--font-family-display);
      font-size: 2.25rem;
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-4);
    }
    .status {
      font-family: var(--font-family-body);
      font-style: italic;
      color: var(--color-border);
    }
    .request-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .request-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) 0;
      border-bottom: 1px solid rgba(143, 123, 61, 0.3);
    }
    .request-info {
      min-width: 0;
    }
    .from {
      font-family: var(--font-family-display);
      font-weight: 600;
      color: var(--color-text);
    }
    .detail {
      font-family: var(--font-family-body);
      font-size: 0.9375rem;
      color: var(--color-text);
    }
    .request-actions {
      display: flex;
      gap: var(--space-2);
      flex-shrink: 0;
    }
    .request-actions button {
      border: none;
      border-radius: 6px;
      font-family: var(--font-family-body);
      font-weight: 700;
      font-size: 0.8125rem;
      padding: var(--space-1) var(--space-3);
      cursor: pointer;
    }
    .request-actions button[disabled] {
      opacity: 0.5;
      cursor: progress;
    }
    .accept {
      background: var(--color-background-header);
      color: var(--color-text-inverted);
    }
    .decline {
      background: transparent;
      color: var(--color-link);
      text-decoration: underline;
    }
  `;
}
