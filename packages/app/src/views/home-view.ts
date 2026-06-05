import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface HomeVM {
  shows?: Show[];
}

export class HomeViewElement extends HTMLElement {
  viewModel = createViewModel<HomeVM>({})
    .with(fromStore<Model>(this), "shows");

  view = html`
    <section>
      <h1>Concerts</h1>
      <ul>
        ${($: HomeVM) =>
          $.shows
            ? $.shows.map(
                (s: Show) => html`
                  <li>
                    <a href=${`/app/shows/${s.id}`}>${s.title}</a>
                    —
                    <time datetime=${s.datetime}>${s.date}</time>
                    at ${s.venue}
                  </li>
                `
              )
            : html`<li>Loading…</li>`}
      </ul>
    </section>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(HomeViewElement.styles)
      .replace(this.viewModel.render(this.view));
  }

  connectedCallback() {
    Store.dispatch(this, ["shows/request"]);
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--space-4);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }
    section {
      display: grid;
      gap: var(--space-3);
    }
    h1 {
      color: var(--color-link);
      font-family: var(--font-family-display);
      font-size: 1.6rem;
      font-weight: 600;
    }
    ul {
      list-style: none;
      padding: 0;
      display: grid;
      gap: var(--space-3);
    }
    li {
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-border);
    }
    li:last-child {
      border-bottom: none;
    }
    a {
      color: var(--color-link);
      font-weight: 600;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    time {
      font-family: var(--font-family-display);
    }
  `;
}
