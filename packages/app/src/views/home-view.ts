import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

type SortMode = "recent" | "rated";

interface HomeVM {
  shows?: Show[];
  sortMode: SortMode;
}

function sortShows(shows: Show[], mode: SortMode): Show[] {
  const copy = [...shows];
  if (mode === "rated") {
    return copy.sort((a, b) => {
      const ra = (a as Show & { rating?: number }).rating ?? 0;
      const rb = (b as Show & { rating?: number }).rating ?? 0;
      return rb - ra;
    });
  }
  // recent: sort by datetime descending
  return copy.sort((a, b) => (b.datetime ?? "").localeCompare(a.datetime ?? ""));
}

function excerpt(text: string | undefined, maxLen: number): string {
  if (!text) return "";
  return text.length <= maxLen ? text : text.slice(0, maxLen).trimEnd() + "…";
}

function formatRating(show: Show): string {
  const r = (show as Show & { rating?: number }).rating;
  if (r == null) return "—";
  return Number.isInteger(r) ? r.toFixed(1) : String(r);
}

function buildMeta(show: Show): string {
  const parts: string[] = [];
  if (show.artistName) parts.push(show.artistName);
  if (show.venue) parts.push(show.venue);
  if (show.date) parts.push(show.date);
  return parts.join(" · ");
}

export class HomeViewElement extends HTMLElement {
  viewModel = createViewModel<HomeVM>({ sortMode: "recent" })
    .with(fromStore<Model>(this), "shows");

  view = html`
    ${($: HomeVM) => {
      const sorted = $.shows ? sortShows($.shows, $.sortMode) : undefined;

      return html`
        <div class="feed-header">
          <h1>My Concerts</h1>
          <div class="feed-header-right">
            <div class="sort-toggle" role="group" aria-label="Sort order">
              <button
                type="button"
                class=${$.sortMode === "recent" ? "sort-btn active" : "sort-btn"}
                data-sort="recent"
              >Recent</button>
              <button
                type="button"
                class=${$.sortMode === "rated" ? "sort-btn active" : "sort-btn"}
                data-sort="rated"
              >Highest rated</button>
            </div>
            <a class="add-link" href="/app/shows/new">+ Add a concert</a>
          </div>
        </div>

        ${!sorted
          ? html`<p class="loading">Loading…</p>`
          : sorted.length === 0
          ? html`
              <div class="empty-state">
                <p class="empty-msg">No concerts yet — add the first one.</p>
                <a class="add-link" href="/app/shows/new">+ Add a concert</a>
              </div>
            `
          : html`
              <div class="feed">
                ${sorted.map((s: Show) => html`
                  <div class="feed-row">
                    ${s.photos?.length
                      ? html`<img class="photo-thumb" src=${s.photos[0]} alt="" />`
                      : html`<div class="photo-thumb" aria-hidden="true"></div>`}
                    <div class="feed-mid">
                      <h2 class="show-title">
                        <a href=${s.href}>${s.title}</a>
                      </h2>
                      <p class="meta">${buildMeta(s)}</p>
                      ${(s as Show & { memoryText?: string }).memoryText
                        ? html`
                            <p class="excerpt">${excerpt((s as Show & { memoryText?: string }).memoryText, 180)}</p>
                            <a class="read-link" href=${s.href}>Read memory →</a>
                          `
                        : html``}
                    </div>
                    <div class="feed-rating">
                      <span class="rating-num">${formatRating(s)}</span>
                    </div>
                  </div>
                `)}
              </div>
            `}
      `;
    }}
  `;

  constructor() {
    super();
    shadow(this)
      .styles(HomeViewElement.styles)
      .replace(this.viewModel.render(this.view))
      .listen({
        click: (ev: Event) => {
          const btn = (ev.target as HTMLElement).closest("[data-sort]") as HTMLElement | null;
          if (!btn) return;
          const mode = btn.dataset.sort as SortMode;
          if (mode === "recent" || mode === "rated") {
            this.viewModel.update({ sortMode: mode });
          }
        }
      });
  }

  connectedCallback() {
    setTimeout(() => Store.dispatch(this, ["shows/request"]), 0);
  }

  static styles = css`
    :host {
      display: block;
    }

    /* ── Header row ── */
    .feed-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    h1 {
      font-family: var(--font-family-display);
      font-size: 2.25rem;
      font-weight: 600;
      color: var(--color-heading);
      margin: 0;
    }
    .feed-header-right {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    /* ── Sort toggle ── */
    .sort-toggle {
      display: flex;
      gap: var(--space-3);
    }
    .sort-btn {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0 0 2px;
      cursor: pointer;
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      color: var(--color-border);
    }
    .sort-btn.active {
      color: var(--color-text);
      border-bottom-color: var(--color-accent);
    }
    .sort-btn:hover:not(.active) {
      color: var(--color-text);
    }

    /* ── Add link ── */
    .add-link {
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      color: var(--color-link);
      text-decoration: none;
    }
    .add-link:hover {
      text-decoration: underline;
    }

    /* ── Feed ── */
    .feed {
      display: flex;
      flex-direction: column;
    }
    .feed-row {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
      padding: var(--space-4) 0;
      border-bottom: 1px solid rgba(143, 123, 61, 0.3);
    }
    .feed-row:last-child {
      border-bottom: none;
    }

    /* ── Photo placeholder ── */
    .photo-thumb {
      width: 88px;
      height: 88px;
      flex-shrink: 0;
      object-fit: cover;
      background-color: var(--color-surface);
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    /* ── Middle column ── */
    .feed-mid {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .show-title {
      font-family: var(--font-family-display);
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
    }
    .show-title a {
      color: var(--color-text);
      text-decoration: none;
    }
    .show-title a:hover {
      color: var(--color-link);
    }
    .meta {
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 0.8125rem;
      color: var(--color-border);
      margin: 0;
    }
    .excerpt {
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--color-text);
      margin: var(--space-1) 0 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .read-link {
      font-family: var(--font-family-body);
      font-size: 0.8125rem;
      color: var(--color-link);
      text-decoration: none;
      margin-top: var(--space-1);
    }
    .read-link:hover {
      text-decoration: underline;
    }

    /* ── Rating column ── */
    .feed-rating {
      flex-shrink: 0;
      width: 72px;
      text-align: right;
      padding-top: 2px;
    }
    .rating-num {
      font-family: var(--font-family-display);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--color-text);
      display: inline-block;
      border-bottom: 2px solid var(--color-accent);
      padding-bottom: 2px;
      line-height: 1;
    }

    /* ── Empty / loading states ── */
    .loading {
      font-family: var(--font-family-body);
      font-style: italic;
      color: var(--color-border);
      padding: var(--space-4) 0;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5) 0;
      text-align: center;
    }
    .empty-msg {
      font-family: var(--font-family-display);
      font-style: italic;
      font-size: 1.25rem;
      color: var(--color-border);
      margin: 0;
    }
  `;
}
