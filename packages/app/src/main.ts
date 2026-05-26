import { define, html } from "@unbndl/html";
import { BrowserHistory, Switch } from "@unbndl/switch";
import { HomeViewElement } from "./views/home-view.ts";
import { ShowViewElement } from "./views/show-view.ts";

const routes = [
  {
    path: "/app/shows/:id",
    view: html`<show-view show-id=${($: any) => $.params.id}></show-view>`
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
  "router-switch": class extends Switch.Element {
    constructor() {
      // Cast: @unbndl/switch's d.ts types SwitchRoute as an intersection
      // (SwitchPath & RedirectCase) rather than a union, so it rejects
      // valid runtime shapes (a route is EITHER a view OR a redirect).
      super(routes as any);
    }
  },
  "home-view": HomeViewElement,
  "show-view": ShowViewElement
});
