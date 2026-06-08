import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";
import { uploadImage } from "../lib/images.ts";

const DEFAULT_RATING = 5;

interface EditVM {
  show?: Show;
  showId?: string;
}

export class ShowEditViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  private songCount = 0;

  viewModel = createViewModel<EditVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article class="form-page">
      ${($: EditVM) => {
        if (!$.showId) return html`<p class="status">No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p class="status">Loading…</p>`;

        const s = $.show;
        const rating = (s as Show & { rating?: number }).rating ?? DEFAULT_RATING;
        const songs = s.songs ?? [];

        return html`
          <header class="form-header">
            <h1>Edit concert</h1>
          </header>

          <form data-edit-form>
            <section class="field-group">
              <label class="field">
                <span class="field-label">Title</span>
                <input name="title" value=${s.title} required />
              </label>
              <label class="field">
                <span class="field-label">Artist</span>
                <input name="artistName" value=${s.artistName ?? ""} />
              </label>
              <label class="field">
                <span class="field-label">Venue</span>
                <input name="venue" value=${s.venue} required />
              </label>
              <label class="field">
                <span class="field-label">Date</span>
                <input type="date" name="datetime" value=${s.datetime} required />
              </label>
            </section>

            <section class="cover-section">
              <span class="field-label">Cover image</span>
              <div class="photo-zone" data-cover-zone>
                ⬆ Add a header image for this show.
              </div>
              <input
                type="file"
                accept="image/*"
                class="visually-hidden"
                data-cover-input
              />
              <div class="cover-preview" data-cover-preview>
                ${s.coverImage
                  ? html`<img
                      class="cover-thumb"
                      src=${s.coverImage}
                      data-url=${s.coverImage}
                      alt=""
                    />`
                  : html``}
              </div>
            </section>

            <section class="rating-section">
              <span class="field-label">Rating</span>
              <div class="rating-row">
                <input
                  type="range"
                  name="rating"
                  min="1"
                  max="10"
                  step="0.1"
                  value=${String(rating)}
                  data-rating-slider
                />
                <span class="rating-display" data-rating-display
                  >${rating.toFixed(1)}</span
                >
              </div>
            </section>

            <section class="memory-section">
              <span class="field-label">Memory</span>
              <textarea
                name="memoryText"
                rows="6"
                placeholder="What do you remember about this night?"
                .value=${s.memoryText ?? ""}
              ></textarea>
            </section>

            <section class="photos-section">
              <span class="field-label">Photos</span>
              <div class="photo-zone" data-photo-zone>
                ⬆ Drop photos here, or click to add.
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                class="visually-hidden"
                data-photo-input
              />
              <div class="photo-previews" data-photo-previews>
                ${(s.photos ?? []).map(
                  (url: string) => html`
                    <div class="photo-preview-wrap">
                      <img
                        class="photo-preview"
                        src=${url}
                        data-url=${url}
                        alt=""
                      />
                      <button
                        type="button"
                        class="photo-remove"
                        data-remove-photo
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  `
                )}
              </div>
            </section>

            <section class="setlist-section">
              <span class="field-label">Setlist</span>
              <div data-song-list>
                ${songs.map(
                  (song: string, i: number) => html`
                    <div class="song-row">
                      <span class="song-num">${i + 1}.</span>
                      <input
                        class="song-input"
                        name=${`song-existing-${i}`}
                        value=${song}
                      />
                      <button
                        type="button"
                        class="song-remove"
                        data-remove-song
                        aria-label="Remove song"
                      >
                        ×
                      </button>
                    </div>
                  `
                )}
              </div>
              <button type="button" class="add-song" data-add-song>
                + Add a song
              </button>
            </section>

            <p class="error" data-error></p>

            <div class="actions">
              <button type="submit" class="save-btn" data-submit>Save</button>
              <a class="cancel-link" href=${`/app/shows/${s.id}`}>Cancel</a>
            </div>
          </form>
        `;
      }}
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ShowEditViewElement.styles)
      .replace(this.viewModel.render(this.view))
      .listen({
        submit: (ev: Event) => this.submitForm(ev),
        input: (ev: Event) => this.handleInput(ev),
        click: (ev: Event) => this.handleClick(ev),
        change: (ev: Event) => this.handleChange(ev)
      });
  }

  private handleChange(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const files = target.files ? Array.from(target.files) : [];
    if (target.dataset.photoInput !== undefined) {
      files.forEach((file) => this.uploadPhoto(file));
    } else if (target.dataset.coverInput !== undefined) {
      if (files[0]) this.uploadCover(files[0]);
    } else {
      return;
    }
    target.value = ""; // allow re-selecting the same file
  }

  private uploadPhoto(file: File) {
    uploadImage(file)
      .then((url) => this.addPhoto(url))
      .catch((err: Error) => this.showError(err));
  }

  private uploadCover(file: File) {
    uploadImage(file)
      .then((url) => this.setCover(url))
      .catch((err: Error) => this.showError(err));
  }

  private showError(err: Error) {
    const errEl = this.shadowRoot?.querySelector(
      "[data-error]"
    ) as HTMLElement | null;
    if (errEl) errEl.textContent = err.message || String(err);
  }

  private addPhoto(url: string) {
    const container = this.shadowRoot?.querySelector(
      "[data-photo-previews]"
    ) as HTMLElement | null;
    if (!container) return;
    const wrap = document.createElement("div");
    wrap.className = "photo-preview-wrap";
    const img = document.createElement("img");
    img.src = url;
    img.dataset.url = url;
    img.className = "photo-preview";
    img.alt = "";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "photo-remove";
    remove.dataset.removePhoto = "";
    remove.setAttribute("aria-label", "Remove photo");
    remove.textContent = "×";
    wrap.appendChild(img);
    wrap.appendChild(remove);
    container.appendChild(wrap);
  }

  private setCover(url: string) {
    const container = this.shadowRoot?.querySelector(
      "[data-cover-preview]"
    ) as HTMLElement | null;
    if (!container) return;
    container.replaceChildren();
    const img = document.createElement("img");
    img.src = url;
    img.dataset.url = url;
    img.className = "cover-thumb";
    img.alt = "";
    container.appendChild(img);
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
    const { showId, show } = this.viewModel.toObject() as EditVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    Store.dispatch(this, ["show/request", { id: showId }]);
  }

  private handleInput(ev: Event) {
    const target = ev.target as HTMLElement;
    if (!target.hasAttribute("data-rating-slider")) return;
    const value = (target as HTMLInputElement).value;
    const display = this.shadowRoot?.querySelector(
      "[data-rating-display]"
    ) as HTMLElement | null;
    if (display) display.textContent = parseFloat(value).toFixed(1);
  }

  private handleClick(ev: Event) {
    const target = ev.target as HTMLElement;
    if (target.dataset.addSong !== undefined) {
      this.addSong();
      return;
    }
    if (target.closest("[data-remove-photo]")) {
      target.closest(".photo-preview-wrap")?.remove();
      return;
    }
    if (target.closest("[data-remove-song]")) {
      target.closest(".song-row")?.remove();
      return;
    }
    if (target.closest("[data-photo-zone]")) {
      const input = this.shadowRoot?.querySelector(
        "[data-photo-input]"
      ) as HTMLInputElement | null;
      input?.click();
      return;
    }
    if (target.closest("[data-cover-zone]")) {
      const input = this.shadowRoot?.querySelector(
        "[data-cover-input]"
      ) as HTMLInputElement | null;
      input?.click();
    }
  }

  private addSong() {
    const list = this.shadowRoot?.querySelector(
      "[data-song-list]"
    ) as HTMLElement | null;
    if (!list) return;
    this.songCount += 1;
    const existing = list.querySelectorAll(".song-row").length;
    const row = document.createElement("div");
    row.className = "song-row";
    const num = document.createElement("span");
    num.className = "song-num";
    num.textContent = `${existing + 1}.`;
    const input = document.createElement("input");
    input.className = "song-input";
    input.name = `song-add-${this.songCount}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "song-remove";
    remove.dataset.removeSong = "";
    remove.setAttribute("aria-label", "Remove song");
    remove.textContent = "×";
    row.appendChild(num);
    row.appendChild(input);
    row.appendChild(remove);
    list.appendChild(row);
    input.focus();
  }

  private submitForm(ev: Event) {
    ev.preventDefault();
    const { showId, show } = this.viewModel.toObject() as EditVM;
    if (!showId || !show) return;

    const form = ev.target as HTMLFormElement;
    const title = getValue(form, "title");
    const artistName = getValue(form, "artistName");
    const venue = getValue(form, "venue");
    const datetime = getValue(form, "datetime");
    const memoryText = getValue(form, "memoryText");
    const rating = parseFloat(getValue(form, "rating"));
    const songs = collectSongs(form);
    const photos = collectPhotos(this.shadowRoot);
    const coverImage = collectCover(this.shadowRoot);

    const updated: Show = {
      ...show,
      title,
      artistName: artistName || undefined,
      venue,
      datetime,
      date: formatDisplayDate(datetime),
      rating: Number.isNaN(rating) ? undefined : rating,
      memoryText: memoryText || undefined,
      songs: songs.length > 0 ? songs : undefined,
      photos: photos.length > 0 ? photos : undefined,
      coverImage: coverImage || undefined
    };

    const root = this.shadowRoot;
    const errEl = root?.querySelector("[data-error]") as HTMLElement | null;
    const btn = root?.querySelector(
      "[data-submit]"
    ) as HTMLButtonElement | null;
    if (errEl) errEl.textContent = "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Saving…";
    }

    Store.dispatch(this, [
      "show/save",
      { id: showId, show: updated },
      {
        onSuccess: () => {
          navigateTo(`/app/shows/${showId}`);
        },
        onFailure: (err: Error) => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Save";
          }
          if (errEl) errEl.textContent = err.message || String(err);
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

    .status {
      font-family: var(--font-family-body);
      font-style: italic;
      color: var(--color-border);
    }

    /* ── Header ── */
    .form-header {
      margin-bottom: var(--space-4);
    }
    h1 {
      font-family: var(--font-family-display);
      font-size: 2.25rem;
      font-weight: 600;
      color: var(--color-heading);
      margin: 0;
    }

    form {
      display: flex;
      flex-direction: column;
    }

    /* ── Section dividers ── */
    section {
      padding: var(--space-4) 0;
      border-top: 1px solid rgba(143, 123, 61, 0.35);
    }
    section:first-of-type {
      border-top: none;
      padding-top: 0;
    }

    /* ── Field labels ── */
    .field-label {
      display: block;
      font-family: var(--font-family-body);
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-accent);
      margin-bottom: var(--space-1);
    }

    /* ── Basics ── */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .field {
      display: block;
    }

    /* ── Shared input style ── */
    input:not([type="file"]),
    textarea {
      width: 100%;
      border: none;
      border-bottom: 1px solid var(--color-accent);
      border-radius: 0;
      background: transparent;
      color: var(--color-text);
      font: inherit;
      padding: var(--space-2) 0;
    }
    input:not([type="file"]):focus,
    textarea:focus {
      outline: none;
      border-bottom-width: 2px;
    }

    /* Visually hidden but still rendered, so the file input stays
       interactable (real clicks + automation) unlike display:none. */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    textarea {
      resize: vertical;
      line-height: 1.6;
    }

    /* ── Rating ── */
    .rating-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }
    input[type="range"] {
      flex: 1;
      border: none;
      padding: 0;
      accent-color: var(--color-link);
      cursor: pointer;
    }
    .rating-display {
      font-family: var(--font-family-display);
      font-size: 3.5rem;
      font-weight: 600;
      color: var(--color-accent);
      line-height: 1;
      min-width: 5rem;
      text-align: right;
    }

    /* ── Photos ── */
    .photo-zone {
      display: block;
      border: 1.5px dashed var(--color-accent);
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 0.875rem;
      color: var(--color-border);
      cursor: pointer;
    }
    .photo-zone:hover {
      background: rgba(143, 123, 61, 0.06);
    }
    .photo-previews {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-top: var(--space-3);
    }
    .photo-preview-wrap {
      position: relative;
      display: inline-block;
    }
    .photo-preview {
      width: 96px;
      height: 96px;
      object-fit: cover;
      border: 4px solid #fff;
      border-radius: 2px;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.22);
      display: block;
    }
    .photo-remove {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 22px;
      height: 22px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }
    .photo-remove:hover {
      background: var(--color-accent);
    }

    /* ── Cover image preview ── */
    .cover-preview:not(:empty) {
      margin-top: var(--space-3);
    }
    .cover-thumb {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: block;
      border-radius: var(--radius-card);
    }

    /* ── Setlist ── */
    .song-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }
    .song-num {
      font-family: var(--font-family-display);
      color: var(--color-accent);
      flex-shrink: 0;
    }
    .song-remove {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: none;
      color: var(--color-link);
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
    }
    .song-remove:hover {
      background: rgba(143, 123, 61, 0.12);
      color: var(--color-accent);
    }
    .add-song {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      color: var(--color-link);
    }
    .add-song:hover {
      text-decoration: underline;
    }

    /* ── Footer actions ── */
    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid rgba(143, 123, 61, 0.35);
    }
    .save-btn {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: 6px;
      background: var(--color-background-header);
      color: var(--color-text-inverted);
      font-family: var(--font-family-body);
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
    }
    .save-btn[disabled] {
      opacity: 0.5;
      cursor: progress;
    }
    .cancel-link {
      font-family: var(--font-family-body);
      font-size: 0.875rem;
      color: var(--color-link);
      text-decoration: none;
    }
    .cancel-link:hover {
      text-decoration: underline;
    }

    /* ── Error ── */
    .error {
      color: #b00020;
      font-size: 0.875rem;
      min-height: 1.2em;
      margin: var(--space-2) 0 0;
    }
    .error:empty {
      display: none;
    }
  `;
}

function getValue(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
  return el ? el.value : "";
}

function collectSongs(form: HTMLFormElement): string[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>('[name^="song-"]'))
    .map((el) => el.value.trim())
    .filter(Boolean);
}

function collectPhotos(root: ShadowRoot | null): string[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLImageElement>("[data-photo-previews] img")
  )
    .map((img) => img.dataset.url || "")
    .filter(Boolean);
}

function collectCover(root: ShadowRoot | null): string {
  const img = root?.querySelector(
    "[data-cover-preview] img"
  ) as HTMLImageElement | null;
  return img?.dataset.url || "";
}

function formatDisplayDate(yyyyMmDd: string): string {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function navigateTo(href: string) {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
