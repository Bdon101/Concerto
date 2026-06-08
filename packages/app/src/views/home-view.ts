import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./home-view.css?inline";

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
                ${sorted.map((s: Show) => {
                  const thumb = s.coverImage || s.photos?.[0];
                  return html`
                  <div class="feed-row">
                    <div class="thumb-wrap">
                      ${thumb
                        ? html`<img class="thumb-polaroid" src=${thumb} alt="" />`
                        : html`<div class="thumb-polaroid placeholder" aria-hidden="true"></div>`}
                    </div>
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
                `;
                })}
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

  static styles = css`${rawStyles}`;
}
