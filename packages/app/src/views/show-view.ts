import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { fromAuth } from "@unbndl/auth";
import { Show } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./show-view.css?inline";

interface ShowVM {
  show?: Show;
  showId?: string;
  username?: string;
}

function formatRating(show: Show): string {
  const r = (show as Show & { rating?: number }).rating;
  if (r == null) return "—";
  return Number.isInteger(r) ? r.toFixed(1) : String(r);
}

export class ShowViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<ShowVM>({})
    .with(fromStore<Model>(this), "show")
    .with(fromAuth(this), "username");

  view = html`
    ${($: ShowVM) => {
      if (!$.showId) return html`<p class="status">No show selected.</p>`;
      if (!$.show || $.show.id !== $.showId)
        return html`<p class="status">Loading…</p>`;

      const s = $.show;
      const rating = formatRating(s);
      const artistDisplay = s.artistName || s.title;
      // Missing owner = legacy/own data; treat as owner so the UI isn't locked.
      const isOwner = !s.ownerUsername || s.ownerUsername === $.username;
      const sharedWith = s.sharedWith ?? [];

      return html`
        <a class="back-link" href="/app">← All concerts</a>

        ${s.coverImage
          ? html`<img class="hero" src=${s.coverImage} alt="" />`
          : html``}

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
          ${isOwner
            ? html`
                ${sharedWith.length > 0
                  ? html`<ul class="friend-list">
                      ${sharedWith.map(
                        (u: string) => html`<li>${u}</li>`
                      )}
                    </ul>`
                  : html`<p class="coming-soon">No friends tagged yet.</p>`}
                <form class="tag-form" data-tag-form>
                  <input
                    name="toUsername"
                    placeholder="Friend's username"
                    autocomplete="off"
                  />
                  <button type="submit" data-tag-submit>Tag</button>
                </form>
                <p class="tag-msg" data-tag-msg></p>
              `
            : html`<p class="coming-soon">
                Shared with you by ${s.ownerUsername ?? "someone"}.
              </p>`}
        </section>

        <hr class="divider" />

        ${isOwner
          ? html`<a class="edit-link" href=${`/app/shows/${s.id}/edit`}>Edit</a>`
          : html``}
      `;
    }}
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ShowViewElement.styles)
      .replace(this.viewModel.render(this.view))
      .listen({
        submit: (ev: Event) => this.submitTag(ev)
      });
  }

  private submitTag(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    if (form.dataset.tagForm === undefined) return;

    const { showId } = this.viewModel.toObject() as ShowVM;
    if (!showId) return;

    const input = form.elements.namedItem(
      "toUsername"
    ) as HTMLInputElement | null;
    const toUsername = (input?.value ?? "").trim();

    const msgEl = this.shadowRoot?.querySelector(
      "[data-tag-msg]"
    ) as HTMLElement | null;
    const btn = form.querySelector(
      "[data-tag-submit]"
    ) as HTMLButtonElement | null;

    if (!toUsername) {
      if (msgEl) {
        msgEl.textContent = "Enter a username.";
        msgEl.className = "tag-msg error";
      }
      return;
    }

    if (msgEl) msgEl.textContent = "";
    if (btn) btn.disabled = true;

    Store.dispatch(this, [
      "share/create",
      { showId, toUsername },
      {
        onSuccess: () => {
          if (btn) btn.disabled = false;
          if (input) input.value = "";
          if (msgEl) {
            msgEl.textContent = `Invite sent to ${toUsername}.`;
            msgEl.className = "tag-msg success";
          }
        },
        onFailure: (err: Error) => {
          if (btn) btn.disabled = false;
          if (msgEl) {
            msgEl.textContent = err.message || String(err);
            msgEl.className = "tag-msg error";
          }
        }
      }
    ]);
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

  static styles = css`${rawStyles}`;
}
