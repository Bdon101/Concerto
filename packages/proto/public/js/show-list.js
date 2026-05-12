import { css, html, shadow } from "@unbndl/html";
import reset from "./styles/reset.css.js";

export class ShowListElement extends HTMLElement {
  static observedAttributes = ["src"];

  constructor() {
    super();
    shadow(this).styles(reset.styles, ShowListElement.styles);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (name === "src" && newValue) {
      this.hydrate(newValue).then((data) => {
        if (!data) return;
        const view = ShowListElement.render(data);
        shadow(this).replace(view);
      });
    }
  }

  hydrate(src) {
    return fetch(src)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`HTTP Status ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.log(`Could not fetch ${src}:`, error);
      });
  }

  static render(data) {
    const shows = data?.shows || [];
    return html`
      <ul class="show-list">
        ${shows.map(renderShow)}
      </ul>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .show-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: var(--space-4);
    }

    @media (max-width: 900px) {
      .show-list {
        grid-template-columns: 1fr;
      }
    }
  `;
}

function renderShow(show) {
  const { href, datetime, title, date, venue } = show;
  return html`
    <li>
      <concerto-show-card href=${href} datetime=${datetime}>
        <span slot="title">${title}</span>
        <span slot="date">${date}</span>
        <span slot="venue">${venue}</span>
      </concerto-show-card>
    </li>
  `;
}
