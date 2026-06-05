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
    }
    .edit {
      max-width: 480px;
      padding: 1.5rem;
    }
    form {
      display: grid;
      gap: 1rem;
    }
    label {
      display: grid;
      gap: 0.25rem;
    }
    input {
      padding: 0.4rem;
      font: inherit;
    }
    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #999;
      background: #fff;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
    }
    button[disabled] {
      opacity: 0.5;
      cursor: progress;
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
