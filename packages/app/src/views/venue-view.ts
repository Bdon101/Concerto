import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Venue, Show } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./styles/venue-view.css?inline";

interface VenueVM {
  venue?: Venue;
  venueId?: string;
  shows?: Show[];
}

export class VenueViewElement extends HTMLElement {
  static observedAttributes = ["venue-id"];

  viewModel = createViewModel<VenueVM>({})
    .with(fromStore<Model>(this), "venue", "shows");

  view = html`
    <article>
      ${($: VenueVM) => {
        if (!$.venueId) return html`<p>No venue selected.</p>`;
        if (!$.venue || $.venue.id !== $.venueId)
          return html`<p>Loading…</p>`;
        const hereShows =
          $.shows?.filter((s) => s.venue === $.venue!.name) ?? [];
        return html`
          <h1>${$.venue.name}</h1>
          <p class="city">${$.venue.city}</p>
          <h2>Shows hosted</h2>
          ${hereShows.length === 0
            ? html`<p>No shows on file at this venue yet.</p>`
            : html`
                <ul>
                  ${hereShows.map(
                    (s: Show) => html`
                      <li>
                        <a href=${`/app/shows/${s.id}`}>${s.title}</a>
                        —
                        <time datetime=${s.datetime}>${s.date}</time>
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
      .styles(VenueViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

  attributeChangedCallback(
    name: string,
    _: string | null,
    newValue: string | null
  ) {
    if (name === "venue-id") {
      const id = newValue || undefined;
      this.viewModel.update({ venueId: id });
      this.maybeRequest();
    }
  }

  connectedCallback() {
    this.maybeRequest();
  }

  private maybeRequest() {
    if (!this.isConnected) return;
    const { venueId, venue, shows } = this.viewModel.toObject() as VenueVM;
    if (!venueId) return;
    setTimeout(() => {
      if (!venue || venue.id !== venueId)
        Store.dispatch(this, ["venue/request", { id: venueId }]);
      if (!shows) Store.dispatch(this, ["shows/request"]);
    }, 0);
  }

  static styles = css`${rawStyles}`;
}
