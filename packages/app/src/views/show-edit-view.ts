import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface EditVM {
  show?: Show;
  showId?: string;
}

export class ShowEditViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<EditVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article class="edit">
      ${($: EditVM) => {
        if (!$.showId) return html`<p>No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p>Loading…</p>`;
        return html`
          <h1>Edit show</h1>
          <form data-edit-form>
            <label>
              <span>Title</span>
              <input name="title" value=${$.show.title} required />
            </label>
            <label>
              <span>Venue</span>
              <input name="venue" value=${$.show.venue} required />
            </label>
            <label>
              <span>Date</span>
              <input type="date" name="datetime" value=${$.show.datetime} required />
            </label>
            <p class="error" data-error></p>
            <div class="actions">
              <button type="submit" data-submit>Save</button>
              <a href=${`/app/shows/${$.show.id}`}>Cancel</a>
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
        submit: (ev: Event) => this.submitForm(ev)
      });
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

  private submitForm(ev: Event) {
    ev.preventDefault();
    const { showId, show } = this.viewModel.toObject() as EditVM;
    if (!showId || !show) return;

    const form = ev.target as HTMLFormElement;
    const data = formDataToJSON(form);
    const datetime = data.datetime;

    const updated: Show = {
      ...show,
      title: data.title,
      venue: data.venue,
      datetime,
      date: formatDisplayDate(datetime)
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
      padding: var(--space-4);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }
    .edit {
      display: grid;
      gap: var(--space-3);
    }
    h1 {
      color: var(--color-heading);
      font-family: var(--font-family-display);
      font-size: 1.6rem;
      font-weight: 600;
    }
    form {
      display: grid;
      gap: var(--space-3);
    }
    label {
      display: grid;
      gap: var(--space-1);
    }
    input {
      padding: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      background: var(--color-background-page);
      color: var(--color-text);
      font: inherit;
    }
    .actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }
    button {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      background: var(--color-background-header);
      color: var(--color-text-inverted);
      cursor: pointer;
      border-radius: var(--radius-card);
      font: inherit;
    }
    button[disabled] {
      opacity: 0.5;
      cursor: progress;
    }
    a {
      color: var(--color-link);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .error {
      color: #b00020;
      font-size: 0.9rem;
      min-height: 1.2em;
    }
    .error:empty {
      display: none;
    }
  `;
}

function formDataToJSON(form: HTMLFormElement): Record<string, string> {
  const inputs = Array.from(form.querySelectorAll("input"));
  return Object.fromEntries(
    inputs.filter((el) => el.name).map((el) => [el.name, el.value])
  );
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
