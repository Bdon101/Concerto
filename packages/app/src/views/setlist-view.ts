import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface SetlistVM {
  show?: Show;
  showId?: string;
}

export class SetlistViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<SetlistVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article>
      ${($: SetlistVM) => {
        if (!$.showId) return html`<p>No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p>Loading…</p>`;
        const songs = $.show.songs ?? [];
        return html`
          <h1>Setlist for ${$.show.title} at ${$.show.venue}</h1>
          ${songs.length === 0
            ? html`<p>No songs recorded for this show.</p>`
            : html`
                <ol class="songs">
                  ${songs.map((song) => html`<li>${song}</li>`)}
                </ol>
              `}
          <p class="back">
            <a href=${`/app/shows/${$.show.id}`}>← Back to show</a>
          </p>
        `;
      }}
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(SetlistViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

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
    const { showId, show } = this.viewModel.toObject() as SetlistVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    setTimeout(
      () => Store.dispatch(this, ["show/request", { id: showId }]),
      0
    );
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
      gap: var(--space-3);
    }
    h1 {
      color: var(--color-heading);
      font-family: var(--font-family-display);
      font-size: 1.6rem;
      font-weight: 700;
    }
    ol.songs {
      padding-left: 1.5rem;
      display: grid;
      gap: var(--space-1);
    }
    .back a {
      color: var(--color-link);
      text-decoration: none;
    }
    .back a:hover {
      text-decoration: underline;
    }
  `;
}
