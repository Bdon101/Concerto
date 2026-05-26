import { html, shadow } from "@unbndl/html";

type Show = {
  id: string;
  title: string;
  date: string;
  datetime: string;
  venue: string;
  href: string;
};

export class HomeViewElement extends HTMLElement {
  constructor() {
    super();
    shadow(this).replace(html`<p>Loading…</p>`);
    this.hydrate();
  }

  hydrate() {
    fetch("/data/shows.json")
      .then((r) => r.json())
      .then((data: { shows: Show[] }) => {
        const view = html`
          <section>
            <h1>Concerts</h1>
            <ul>
              ${data.shows.map(
                (s) => html`
                  <li>
                    <a href=${`/app/shows/${s.id}`}>${s.title}</a>
                    —
                    <time datetime=${s.datetime}>${s.date}</time>
                    at ${s.venue}
                  </li>
                `
              )}
            </ul>
          </section>
        `;
        shadow(this).replace(view);
      })
      .catch((err) => {
        shadow(this).replace(
          html`<p>Error loading shows: ${err.message}</p>`
        );
      });
  }
}
