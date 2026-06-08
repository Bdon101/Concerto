import { define, html } from "@unbndl/html";
import { BrowserHistory, Switch } from "@unbndl/switch";
import { Store } from "@unbndl/store";
import { Auth } from "@unbndl/auth";
import { Model, init } from "./model.ts";
import { Msg } from "./messages.ts";
import update, { Cmd } from "./update.ts";
import { HomeViewElement } from "./views/home-view.ts";
import { ShowViewElement } from "./views/show-view.ts";
import { ShowEditViewElement } from "./views/show-edit-view.ts";
import { ShowNewViewElement } from "./views/show-new-view.ts";
import { ArtistViewElement } from "./views/artist-view.ts";
import { VenueViewElement } from "./views/venue-view.ts";
import { SetlistViewElement } from "./views/setlist-view.ts";
import { MemoryViewElement } from "./views/memory-view.ts";
import { RequestsViewElement } from "./views/requests-view.ts";
import { AuthStatusElement } from "./components/auth-status.ts";

const routes = [
  {
    // Literal "new" must come before /app/shows/:id, otherwise route-parser
    // matches it as :id="new" and the form is unreachable.
    path: "/app/shows/new",
    view: html`<show-new-view></show-new-view>`
  },
  {
    path: "/app/shows/:id/edit",
    view: html`<show-edit-view show-id=${($: any) => $.params.id}></show-edit-view>`
  },
  {
    path: "/app/shows/:id/setlist",
    view: html`<setlist-view show-id=${($: any) => $.params.id}></setlist-view>`
  },
  {
    path: "/app/shows/:id/memory",
    view: html`<memory-view show-id=${($: any) => $.params.id}></memory-view>`
  },
  {
    path: "/app/shows/:id",
    view: html`<show-view show-id=${($: any) => $.params.id}></show-view>`
  },
  {
    path: "/app/artists/:id",
    view: html`<artist-view artist-id=${($: any) => $.params.id}></artist-view>`
  },
  {
    path: "/app/venues/:id",
    view: html`<venue-view venue-id=${($: any) => $.params.id}></venue-view>`
  },
  {
    path: "/app/requests",
    view: html`<requests-view></requests-view>`
  },
  {
    path: "/app",
    view: html`<home-view></home-view>`
  },
  {
    path: "/",
    redirect: "/app"
  }
];

define({
  "history-provider": BrowserHistory.Provider,
  "auth-provider": Auth.Provider,
  "store-provider": class AppStore extends Store.Provider<Model, Msg, Cmd> {
    constructor() {
      super(update, init);
    }
  },
  "router-switch": class extends Switch.Element {
    constructor() {
      // Cast: @unbndl/switch's d.ts types SwitchRoute as an intersection
      // (SwitchPath & RedirectCase) rather than a union, so it rejects
      // valid runtime shapes (a route is EITHER a view OR a redirect).
      super(routes as any);
    }
  },
  "home-view": HomeViewElement,
  "show-view": ShowViewElement,
  "show-edit-view": ShowEditViewElement,
  "show-new-view": ShowNewViewElement,
  "artist-view": ArtistViewElement,
  "venue-view": VenueViewElement,
  "setlist-view": SetlistViewElement,
  "memory-view": MemoryViewElement,
  "requests-view": RequestsViewElement,
  "concerto-auth-status": AuthStatusElement
});
