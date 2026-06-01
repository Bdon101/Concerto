import { html, shadow } from "@unbndl/html";
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
    shadow(this).replace(this.viewModel.render(this.view));
  }

  connectedCallback() {
    Store.dispatch(this, ["shows/request"]);
  }
}
