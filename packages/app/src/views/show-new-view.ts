import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store } from "@unbndl/store";
import { Show } from "server/models";

export class ShowNewViewElement extends HTMLElement {
  viewModel = createViewModel({});

  view = html`
    <article class="new">
      <h1>Add a show</h1>
      <form data-new-form>
        <label>
          <span>Title</span>
          <input name="title" required />
        </label>
        <label>
          <span>Artist</span>
          <input name="artistName" required />
        </label>
        <label>
          <span>Venue</span>
          <input name="venue" required />
        </label>
        <label>
          <span>Date</span>
          <input type="date" name="datetime" required />
        </label>
        <p class="error" data-error></p>
        <div class="actions">
          <button type="submit" data-submit>Save</button>
          <a href="/app">Cancel</a>
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
        submit: (ev: Event) => this.submitForm(ev)
      });
  }

  private submitForm(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const data = formDataToJSON(form);

    const id = `${slugify(data.title)}-${data.datetime}`;
    const show: Show = {
      id,
      title: data.title,
      artistName: data.artistName,
      venue: data.venue,
      datetime: data.datetime,
      date: formatDisplayDate(data.datetime),
      href: `/app/shows/${id}`
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
    .new {
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
