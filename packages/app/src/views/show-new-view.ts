import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store } from "@unbndl/store";
import { Show } from "server/models";
import { uploadImage } from "../lib/images.ts";
import rawStyles from "./styles/show-new-view.css?inline";

const DEFAULT_RATING = 5;

export class ShowNewViewElement extends HTMLElement {
  private songCount = 0;

  viewModel = createViewModel({});

  view = html`
    <article class="form-page">
      <header class="form-header">
        <h1>Add a concert</h1>
        <p class="subtitle">Write down a night you want to remember.</p>
      </header>

      <form data-new-form>
        <section class="field-group">
          <label class="field">
            <span class="field-label">Title</span>
            <input name="title" required />
          </label>
          <label class="field">
            <span class="field-label">Artist</span>
            <input name="artistName" required />
          </label>
          <label class="field">
            <span class="field-label">Venue</span>
            <input name="venue" required />
          </label>
          <label class="field">
            <span class="field-label">Date</span>
            <input type="date" name="datetime" required />
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
          <div class="cover-preview" data-cover-preview></div>
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
              value=${String(DEFAULT_RATING)}
              data-rating-slider
            />
            <span class="rating-display" data-rating-display
              >${DEFAULT_RATING.toFixed(1)}</span
            >
          </div>
        </section>

        <section class="memory-section">
          <span class="field-label">Memory</span>
          <textarea
            name="memoryText"
            rows="6"
            placeholder="What do you remember about this night?"
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
          <div class="photo-previews" data-photo-previews></div>
        </section>

        <section class="setlist-section">
          <span class="field-label">Setlist</span>
          <div data-song-list></div>
          <button type="button" class="add-song" data-add-song>
            + Add a song
          </button>
        </section>

        <p class="error" data-error></p>

        <div class="actions">
          <button type="submit" class="save-btn" data-submit>Save concert</button>
          <a class="cancel-link" href="/app">Cancel</a>
        </div>
      </form>
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(ShowNewViewElement.styles)
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
    const img = document.createElement("img");
    img.src = url;
    img.dataset.url = url;
    img.className = "photo-preview";
    img.alt = "";
    container.appendChild(img);
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
    const row = document.createElement("div");
    row.className = "song-row";
    const num = document.createElement("span");
    num.className = "song-num";
    num.textContent = `${this.songCount}.`;
    const input = document.createElement("input");
    input.className = "song-input";
    input.name = `song-${this.songCount}`;
    row.appendChild(num);
    row.appendChild(input);
    list.appendChild(row);
    input.focus();
  }

  private submitForm(ev: Event) {
    ev.preventDefault();
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

    const id = `${slugify(title)}-${datetime}`;
    const show: Show = {
      id,
      title,
      artistName,
      venue,
      datetime,
      date: formatDisplayDate(datetime),
      href: `/app/shows/${id}`,
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
      "show/create",
      { show },
      {
        onSuccess: () => {
          navigateTo(`/app/shows/${id}`);
        },
        onFailure: (err: Error) => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Save concert";
          }
          if (errEl) errEl.textContent = err.message || String(err);
        }
      }
    ]);
  }

  static styles = css`${rawStyles}`;
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function navigateTo(href: string) {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
