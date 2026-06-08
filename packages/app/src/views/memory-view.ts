import { css, html, shadow } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { Show } from "server/models";
import { Model } from "../model.ts";
import rawStyles from "./styles/memory-view.css?inline";

interface MemoryVM {
  show?: Show;
  showId?: string;
}

export class MemoryViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  viewModel = createViewModel<MemoryVM>({})
    .with(fromStore<Model>(this), "show");

  view = html`
    <article>
      ${($: MemoryVM) => {
        if (!$.showId) return html`<p>No show selected.</p>`;
        if (!$.show || $.show.id !== $.showId)
          return html`<p>Loading…</p>`;
        const memory = $.show.memoryText ?? "";
        return html`
          <h1>Memory of ${$.show.title} at ${$.show.venue}</h1>
          ${memory
            ? html`<p class="memory">${memory}</p>`
            : html`<p>No memory recorded for this show yet.</p>`}
          <p class="back">
            <a href=${`/app/shows/${$.show.id}`}>← Back to show</a>
          </p>
        `;
      }}
    </article>
  `;

  constructor() {
    super();
    shadow(this)
      .styles(MemoryViewElement.styles)
      .replace(this.viewModel.render(this.view));
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
    const { showId, show } = this.viewModel.toObject() as MemoryVM;
    if (!showId) return;
    if (show && show.id === showId) return;
    setTimeout(
      () => Store.dispatch(this, ["show/request", { id: showId }]),
      0
    );
  }

  static styles = css`${rawStyles}`;
}
