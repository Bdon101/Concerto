import { css, html, shadow } from "@unbndl/html";
import reset from "./styles/reset.css.js";

export class ShowCardElement extends HTMLElement {
  static observedAttributes = ["href", "datetime"];

  static template = html`
    <template>
      <article class="show-card">
        <a data-show-link>
          <slot name="title"></slot>
        </a>
        <p class="show-date">
          <time data-show-date>
            <slot name="date"></slot>
          </time>
        </p>
        <p class="show-place">
          <slot name="venue"></slot>
        </p>
      </article>
    </template>
  `;

  constructor() {
    super();
    shadow(this)
      .template(ShowCardElement.template)
      .styles(reset.styles, ShowCardElement.styles);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case "href":
        this.updateShowLink(newValue);
        break;
      case "datetime":
        this.updateShowDate(newValue);
        break;
      default:
        throw new Error(`Unsupported show card attribute: ${name}`);
    }
  }

  updateShowLink(href) {
    const link = this.shadowRoot?.querySelector("[data-show-link]");
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("ShowCardElement template is missing its show link.");
    }

    if (href === null || href.length === 0) {
      link.removeAttribute("href");
      return;
    }

    link.href = href;
  }

  updateShowDate(datetime) {
    const date = this.shadowRoot?.querySelector("[data-show-date]");
    if (!(date instanceof HTMLTimeElement)) {
      throw new Error("ShowCardElement template is missing its show date.");
    }

    if (datetime === null || datetime.length === 0) {
      date.removeAttribute("datetime");
      return;
    }

    date.dateTime = datetime;
  }

  static styles = css`
    :host {
      display: block;
    }

    .show-card {
      display: grid;
      gap: var(--space-2);
      align-content: start;
      padding: var(--space-4);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }

    a {
      color: var(--color-link);
    }

    .show-date,
    .show-place {
      font-size: 0.95rem;
      font-weight: 700;
    }
  `;
}
