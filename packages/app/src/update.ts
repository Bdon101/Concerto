import { Show } from "server/models";
import { Auth } from "@unbndl/auth";
import { Model } from "./model.ts";
import { Msg, SaveCallbacks } from "./messages.ts";

// Cmd is the set of internal "load" messages the update can produce
// via Promises (handled by Store's service loop, which re-consumes them).
export type Cmd = Msg;

type UpdateResult = Model | [Model, ...Promise<Msg>[]];

export default function update(
  model: Readonly<Model>,
  message: Msg,
  user: Auth.Model
): UpdateResult {
  switch (message[0]) {
    case "shows/request":
      return [model, requestShows(user)];
    case "shows/loaded":
      return { ...model, shows: message[1].shows };
    case "show/request":
      return [model, requestShow(message[1].id, user)];
    case "show/loaded": {
      const updated = message[1].show;
      const shows = model.shows
        ? model.shows.map((s) => (s.id === updated.id ? updated : s))
        : model.shows;
      return { ...model, show: updated, shows };
    }
    case "show/save":
      return [model, saveShow(message[1], message[2], user)];
    case "noop":
      return model;
    default: {
      const _exhaustive: never = message;
      throw new Error(`Unhandled message: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function requestShows(user: Auth.Model): Promise<Msg> {
  return fetch("/api/shows", { headers: Auth.headers(user) })
    .then((res) => {
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((shows: Show[]): Msg => ["shows/loaded", { shows }])
    .catch((): Msg => ["noop"]);
}

function requestShow(id: string, user: Auth.Model): Promise<Msg> {
  return fetch(`/api/shows/${encodeURIComponent(id)}`, {
    headers: Auth.headers(user)
  })
    .then((res) => {
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((show: Show): Msg => ["show/loaded", { show }])
    .catch((): Msg => ["noop"]);
}

function saveShow(
  payload: { id: string; show: Show },
  callbacks: SaveCallbacks,
  user: Auth.Model
): Promise<Msg> {
  return fetch(`/api/shows/${encodeURIComponent(payload.id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(user)
    },
    body: JSON.stringify(payload.show)
  })
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(`Save failed (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((updated: Show): Msg => {
      callbacks.onSuccess?.();
      return ["show/loaded", { show: updated }];
    })
    .catch((err: Error): Msg => {
      callbacks.onFailure?.(err);
      return ["noop"];
    });
}
