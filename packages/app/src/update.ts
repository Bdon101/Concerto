import { Show } from "server/models";
import { Model } from "./model.ts";
import { Msg } from "./messages.ts";

// Cmd is the set of internal "load" messages the update can produce
// via Promises (handled by Store's service loop, which re-consumes them).
export type Cmd = Msg;

type UpdateResult = Model | [Model, ...Promise<Msg>[]];

export default function update(
  model: Readonly<Model>,
  message: Msg,
  _user: unknown
): UpdateResult {
  const [type] = message;
  switch (type) {
    case "shows/request":
      return [model, requestShows()];
    case "shows/loaded": {
      const [, { shows }] = message;
      return { ...model, shows };
    }
    case "show/request": {
      const [, { id }] = message;
      return [model, requestShow(id)];
    }
    case "show/loaded": {
      const [, { show }] = message;
      return { ...model, show };
    }
    default:
      throw new Error(`Unhandled message "${type}"`);
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
