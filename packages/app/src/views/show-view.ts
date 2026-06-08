import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface ShowVM {
  show?: Show;
  showId?: string;
}

function formatRating(show: Show): string {
  const r = (show as Show & { rating?: number }).rating;
  if (r == null) return "—";
  return Number.isInteger(r) ? r.toFixed(1) : String(r);
}

export class ShowViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<ShowVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    ${($: ShowVM) => {
      if (!$.showId) return html`<p class="status">No show selected.</p>`;
      if (!$.show || $.show.id !== $.showId)
        return html`<p class="status">Loading…</p>`;

      const s = $.show;
      const rating = formatRating(s);
      const artistDisplay = s.artistName || s.title;

      return html`
        <a class="back-link" href="/app">← All concerts</a>

        <div class="hero" aria-hidden="true"></div>

        <div class="title-block">
          <div class="title-left">
            <h1>${artistDisplay}</h1>
            <p class="meta">${s.venue}${s.date ? ` · ${s.date}` : ""}</p>
          </div>
          <div class="rating-plaque" aria-label=${"Rating: " + rating}>
            <span class="rating-num">${rating}</span>
          </div>
        </div>

        <hr class="divider" />

        <section class="detail-section">
          <p class="section-label">MEMORY</p>
          ${s.memoryText
            ? html`<p class="memory-body">${s.memoryText}</p>`
            : html`
                <p class="empty-cta">
                  <a href=${`/app/shows/${s.id}/edit`}>Write your memory of this concert →</a>
                </p>
              `}
        </section>

        <hr class="divider" />

        ${(s.photos?.length ?? 0) > 0
          ? html`
              <section class="detail-section">
                <p class="section-label">PHOTOS</p>
                <div class="photo-grid">
                  ${(s.photos ?? []).map(
                    (url: string, i: number) => html`
                      <img
                        class="polaroid"
                        src=${url}
                        alt=${`Photo ${i + 1}`}
                      />
                    `
                  )}
                </div>
              </section>
              <hr class="divider" />
            `
          : html``}

        ${(s.songs?.length ?? 0) > 0
          ? html`
              <section class="detail-section">
                <p class="section-label">SETLIST</p>
                <ol class="songs">
                  ${(s.songs ?? []).map((song: string) => html`<li>${song}</li>`)}
                </ol>
              </section>
              <hr class="divider" />
            `
          : html``}

        <section class="detail-section">
          <p class="section-label">FRIENDS</p>
          <p class="coming-soon">Tagging friends — coming soon.</p>
        </section>

        <hr class="divider" />

        <a class="edit-link" href=${`/app/shows/${s.id}/edit`}>Edit</a>
      `;
    }}
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ShowViewElement.styles)
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
    const { showId, show } = this.viewModel.toObject() as ShowVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    Store.dispatch(this, ["show/request", { id: showId }]);
  }

  static styles = css`
    :host {
      display: block;
      max-width: 880px;
      margin: 0 auto;
    }

    /* ── Back link ── */
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

    /* ── Hero placeholder ── */
    .hero {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, var(--color-surface) 0%, #c4ae8f 100%);
      border-radius: var(--radius-card);
      margin-bottom: var(--space-4);
    }

    /* ── Title block ── */
    .title-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    .title-left {
      min-width: 0;
    }
    h1 {
      font-family: var(--font-family-display);
      font-size: 3.25rem;
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-2);
      line-height: 1.1;
    }
    .meta {
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 1rem;
      color: var(--color-border);
      margin: 0;
    }

    /* ── Rating plaque ── */
    .rating-plaque {
      flex-shrink: 0;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      border: 2px solid var(--color-accent);
      background: var(--color-background-page);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rating-num {
      font-family: var(--font-family-display);
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 1px solid rgba(143, 123, 61, 0.35);
      margin: var(--space-4) 0;
    }

    /* ── Sections ── */
    .detail-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .section-label {
      font-family: var(--font-family-body);
      font-size: 0.6875rem;
      letter-spacing: 0.12em;
      color: var(--color-accent);
      margin: 0;
    }

    /* ── Memory ── */
    .memory-body {
      font-family: var(--font-family-body);
      font-size: 1.125rem;
      line-height: 1.75;
      color: var(--color-text);
      max-width: 640px;
      margin: 0;
    }
    .empty-cta a {
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 1rem;
      color: var(--color-link);
      text-decoration: none;
    }
    .empty-cta a:hover {
      text-decoration: underline;
    }

    /* ── Photos ── */
    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
    .polaroid {
      width: 180px;
      height: 180px;
      object-fit: cover;
      background: #fff;
      border: 8px solid #fff;
      border-bottom-width: 28px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
    }
    .polaroid:nth-child(odd) {
      transform: rotate(-2deg);
    }
    .polaroid:nth-child(even) {
      transform: rotate(1.5deg);
    }

    /* ── Setlist ── */
    .songs {
      list-style: decimal;
      padding-left: 1.5rem;
      margin: 0;
      display: grid;
      gap: var(--space-1);
    }
    .songs li {
      font-family: var(--font-family-body);
      font-size: 1rem;
      line-height: 1.9;
      color: var(--color-text);
      padding-left: var(--space-1);
    }
    .songs::marker,
    .songs li::marker {
      color: var(--color-accent);
    }

    /* ── Friends ── */
    .coming-soon {
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 0.875rem;
      color: var(--color-border);
      margin: 0;
    }

    /* ── Edit link ── */
    .edit-link {
      display: inline-block;
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      color: var(--color-link);
      text-decoration: none;
    }
    .edit-link:hover {
      text-decoration: underline;
    }

    /* ── Status (loading / error) ── */
    .status {
      font-family: var(--font-family-body);
      font-style: italic;
      color: var(--color-border);
    }
  `;
}
