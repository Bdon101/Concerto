import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface ShowVM {
  show?: Show;
  showId?: string;
}

export class ShowViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<ShowVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article>
      ${($: ShowVM) => {
        if (!$.showId) return html`<p>No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p>Loading…</p>`;
        return html`
          <h1>${$.show.title}</h1>
          <p><time datetime=${$.show.datetime}>${$.show.date}</time></p>
          <p>${$.show.venue}</p>
          <nav class="show-links">
            <a href=${`/app/shows/${$.show.id}/edit`}>Edit</a>
            ${$.show.songs?.length
              ? html`<a href=${`/app/shows/${$.show.id}/setlist`}>Setlist</a>`
              : html``}
            ${$.show.memoryText
              ? html`<a href=${`/app/shows/${$.show.id}/memory`}>Memory</a>`
              : html``}
          </nav>
        `;
      }}
      <p><a href="/app">← Back to all shows</a></p>
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ShowViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--space-4);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }
    article {
      display: grid;
      gap: var(--space-2);
    }
    h1 {
      color: var(--color-heading);
      font-family: var(--font-family-display);
      font-size: 2rem;
      font-weight: 700;
    }
    p {
      margin: 0;
    }
    time {
      font-family: var(--font-family-display);
      font-size: 1.1rem;
      color: var(--color-link);
    }
    a {
      color: var(--color-link);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .show-links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-top: var(--space-1);
    }
    .show-links a + a::before {
      content: "·";
      margin-right: var(--space-3);
      color: var(--color-border);
    }
  `;

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (name === "show-id") {
      const id = newValue || undefined;
      this.viewModel.update({ showId: id });
      this.maybeRequest();
    }
  }

  connectedCallback() {
    this.maybeRequest();
  }

  private maybeRequest() {
    if (!this.isConnected) return;
    const { showId, show } = this.viewModel.toObject() as ShowVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    Store.dispatch(this, ["show/request", { id: showId }]);
  }
}
