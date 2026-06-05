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
      return [model, requestShows()];
    case "shows/loaded":
      return { ...model, shows: message[1].shows };
    case "show/request":
      return [model, requestShow(message[1].id)];
    case "show/loaded":
      return { ...model, show: message[1].show };
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

function fetchAllShows(): Promise<Show[]> {
  return fetch("/data/shows.json")
    .then((res) => {
      if (res.status !== 200) throw `HTTP ${res.status}`;
      return res.json();
    })
    .then((json: { shows: Show[] }) => json.shows);
}

function requestShows(): Promise<Msg> {
  return fetchAllShows().then((shows) => ["shows/loaded", { shows }]);
}

function requestShow(id: string): Promise<Msg> {
  return fetchAllShows().then((shows) => {
    const show = shows.find((s) => s.id === id);
    if (!show) throw `Show "${id}" not found`;
    return ["show/loaded", { show }];
  });
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
