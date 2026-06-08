import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Artist, Show } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./styles/artist-view.css?inline";

interface ArtistVM {
  artist?: Artist;
  artistId?: string;
  shows?: Show[];
}

export class ArtistViewElement extends HTMLElement {
  static observedAttributes = ["artist-id"];

  viewModel = createViewModel<ArtistVM>({})
    .with(fromStore<Model>(this), "artist", "shows");

  view = html`
    <article>
      ${($: ArtistVM) => {
        if (!$.artistId) return html`<p>No artist selected.</p>`;
        if (!$.artist || $.artist.id !== $.artistId)
          return html`<p>Loading…</p>`;
        const myShows =
          $.shows?.filter((s) => s.artistName === $.artist!.name) ?? [];
        return html`
          <h1>${$.artist.name}</h1>
          <p class="desc">${$.artist.description}</p>
          <h2>Shows</h2>
          ${myShows.length === 0
            ? html`<p>No shows on file yet.</p>`
            : html`
                <ul>
                  ${myShows.map(
                    (s: Show) => html`
                      <li>
                        <a href=${`/app/shows/${s.id}`}>${s.title}</a>
                        —
                        <time datetime=${s.datetime}>${s.date}</time>
                        at ${s.venue}
                      </li>
                    `
                  )}
                </ul>
              `}
        `;
      }}
      <p><a href="/app">← Back to all shows</a></p>
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ArtistViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (name === "artist-id") {
      const id = newValue || undefined;
      this.viewModel.update({ artistId: id });
      this.maybeRequest();
    }
  }

  connectedCallback() {
    this.maybeRequest();
  }

  private maybeRequest() {
    if (!this.isConnected) return;
    const { artistId, artist, shows } = this.viewModel.toObject() as ArtistVM;
    if (!artistId) return;
    // Defer past the current microtask queue so the store-provider's
    // fromAuth observer has time to populate the Bearer token before
    // the reducer reads `user` (same fix as home-view, commit 22084f3).
    setTimeout(() => {
      if (!artist || artist.id !== artistId)
        Store.dispatch(this, ["artist/request", { id: artistId }]);
      if (!shows) Store.dispatch(this, ["shows/request"]);
    }, 0);
  }

  static styles = css`${rawStyles}`;
}
