import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store } from "@unbndl/store";
import { Show } from "server/models";

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
          <div class="photo-zone">
            ⬆ Drop photos here, or click to add.
          </div>
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
        click: (ev: Event) => this.handleClick(ev)
      });
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
    if (target.dataset.addSong !== undefined) this.addSong();
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
      songs: songs.length > 0 ? songs : undefined
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

  static styles = css`
    :host {
      display: block;
      max-width: 640px;
      margin: 0 auto;
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
    .subtitle {
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 0.875rem;
      color: var(--color-border);
      margin: var(--space-1) 0 0;
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
    input,
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
    input:focus,
    textarea:focus {
      outline: none;
      border-bottom-width: 2px;
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

    /* ── Photos drop zone (UI only) ── */
    .photo-zone {
      border: 1.5px dashed var(--color-accent);
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      font-family: var(--font-family-body);
      font-style: italic;
      font-size: 0.875rem;
      color: var(--color-border);
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
