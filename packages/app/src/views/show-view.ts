import { html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";

interface ShowVM {
  show?: Show;
  showId?: string;
}

export class ShowViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<ShowVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article>
      ${($: ShowVM) => {
        if (!$.showId) return html`<p>No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p>Loading…</p>`;
        return html`
          <h1>${$.show.title}</h1>
          <p><time datetime=${$.show.datetime}>${$.show.date}</time></p>
          <p>${$.show.venue}</p>
        `;
      }}
      <p><a href="/app">← Back to all shows</a></p>
    </article>
  `;

  constructor() {
    super();
    shadow(this).replace(this.viewModel.render(this.view));
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
    const { showId, show } = this.viewModel.toObject() as ShowVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    Store.dispatch(this, ["show/request", { id: showId }]);
  }
}
