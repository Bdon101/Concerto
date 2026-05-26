import { html, shadow } from "@unbndl/html";

type Show = {
  id: string;
  title: string;
  date: string;
  datetime: string;
  venue: string;
  href: string;
};

export class ShowViewElement extends HTMLElement {
  static observedAttributes = ["show-id"];

  constructor() {
    super();
    shadow(this).replace(html`<p>Loading…</p>`);
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ) {
    if (name === "show-id" && newValue) {
      this.hydrate(newValue);
    }
  }

  hydrate(id: string) {
    fetch("/data/shows.json")
      .then((r) => r.json())
      .then((data: { shows: Show[] }) => {
        const show = data.shows.find((s) => s.id === id);
        if (!show) {
          shadow(this).replace(html`
            <article>
              <p>Show not found.</p>
              <p><a href="/app">← Back to all shows</a></p>
            </article>
          `);
          return;
        }
        shadow(this).replace(html`
          <article>
            <h1>${show.title}</h1>
            <p><time datetime=${show.datetime}>${show.date}</time></p>
            <p>${show.venue}</p>
            <p><a href="/app">← Back to all shows</a></p>
          </article>
        `);
      })
      .catch((err) => {
        shadow(this).replace(
          html`<p>Error loading show: ${err.message}</p>`
        );
      });
  }
}
