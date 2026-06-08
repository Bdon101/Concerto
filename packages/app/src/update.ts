import { Show, Artist, Venue, ShareRequest } from "server/models";
import { Auth } from "@unbndl/auth";
import { Model } from "./model.ts";
import { Msg, SaveCallbacks } from "./messages.ts";

// Cmd is the set of internal "load" messages the update can produce
// via Promises (handled by Store's service loop, which re-consumes them).
export type Cmd = Msg;

const LOGIN_URL = "/login.html";

// When the server rejects a request with 401, the stored token is expired
// or invalid. The auth provider only checks whether a token is *present*,
// so a stale token leaves the UI stuck "authenticated" while every request
// fails — the home list then hangs on "Loading…". Clear the token and send
// the user to the login page. Throwing afterward lets each request's
// existing catch fall through to a noop as the browser navigates away.
function redirectIfUnauthorized(res: Response): void {
  if (res.status !== 401) return;
  try {
    window.localStorage.removeItem(Auth.User.TOKEN_KEY);
  } catch {
    // localStorage may be unavailable (e.g. private mode); redirect anyway.
  }
  window.location.assign(LOGIN_URL);
  throw new Error("Unauthorized");
}

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
    case "show/create":
      return [model, createShow(message[1], message[2], user)];
    case "show/created": {
      const created = message[1].show;
      return {
        ...model,
        show: created,
        shows: model.shows ? [...model.shows, created] : [created]
      };
    }
    case "artists/request":
      return [model, requestArtists(user)];
    case "artists/loaded":
      return { ...model, artists: message[1].artists };
    case "artist/request":
      return [model, requestArtist(message[1].id, user)];
    case "artist/loaded": {
      const updated = message[1].artist;
      const artists = model.artists
        ? model.artists.map((a) => (a.id === updated.id ? updated : a))
        : model.artists;
      return { ...model, artist: updated, artists };
    }
    case "venues/request":
      return [model, requestVenues(user)];
    case "venues/loaded":
      return { ...model, venues: message[1].venues };
    case "venue/request":
      return [model, requestVenue(message[1].id, user)];
    case "venue/loaded": {
      const updated = message[1].venue;
      const venues = model.venues
        ? model.venues.map((v) => (v.id === updated.id ? updated : v))
        : model.venues;
      return { ...model, venue: updated, venues };
    }
    case "shareRequests/request":
      return [model, requestShareRequests(user)];
    case "shareRequests/loaded":
      return { ...model, incomingRequests: message[1].requests };
    case "share/create":
      return [model, createShareRequest(message[1], message[2], user)];
    case "shareRequest/respond":
      return [model, respondShareRequest(message[1], message[2], user)];
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
      redirectIfUnauthorized(res);
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
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((show: Show): Msg => ["show/loaded", { show }])
    .catch((): Msg => ["noop"]);
}

function requestArtists(user: Auth.Model): Promise<Msg> {
  return fetch("/api/artists", { headers: Auth.headers(user) })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((artists: Artist[]): Msg => ["artists/loaded", { artists }])
    .catch((): Msg => ["noop"]);
}

function requestArtist(id: string, user: Auth.Model): Promise<Msg> {
  return fetch(`/api/artists/${encodeURIComponent(id)}`, {
    headers: Auth.headers(user)
  })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((artist: Artist): Msg => ["artist/loaded", { artist }])
    .catch((): Msg => ["noop"]);
}

function requestVenues(user: Auth.Model): Promise<Msg> {
  return fetch("/api/venues", { headers: Auth.headers(user) })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((venues: Venue[]): Msg => ["venues/loaded", { venues }])
    .catch((): Msg => ["noop"]);
}

function requestVenue(id: string, user: Auth.Model): Promise<Msg> {
  return fetch(`/api/venues/${encodeURIComponent(id)}`, {
    headers: Auth.headers(user)
  })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((venue: Venue): Msg => ["venue/loaded", { venue }])
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
      redirectIfUnauthorized(res);
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

function requestShareRequests(user: Auth.Model): Promise<Msg> {
  return fetch("/api/share-requests/incoming", { headers: Auth.headers(user) })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((requests: ShareRequest[]): Msg => [
      "shareRequests/loaded",
      { requests }
    ])
    .catch((): Msg => ["noop"]);
}

function createShareRequest(
  payload: { showId: string; toUsername: string },
  callbacks: SaveCallbacks,
  user: Auth.Model
): Promise<Msg> {
  return fetch("/api/share-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(user)
    },
    body: JSON.stringify(payload)
  })
    .then(async (res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 201) {
        const text = await res.text();
        throw new Error(text || `Request failed (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((): Msg => {
      callbacks.onSuccess?.();
      return ["noop"];
    })
    .catch((err: Error): Msg => {
      callbacks.onFailure?.(err);
      return ["noop"];
    });
}

function respondShareRequest(
  payload: { id: string; action: "accept" | "decline" },
  callbacks: SaveCallbacks,
  user: Auth.Model
): Promise<Msg> {
  return fetch(
    `/api/share-requests/${encodeURIComponent(payload.id)}/${payload.action}`,
    {
      method: "POST",
      headers: Auth.headers(user)
    }
  )
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 200) {
        throw new Error(`Action failed (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((): Msg => {
      callbacks.onSuccess?.();
      // Refresh the inbox so the handled request drops off the list.
      return ["shareRequests/request"];
    })
    .catch((err: Error): Msg => {
      callbacks.onFailure?.(err);
      return ["noop"];
    });
}

function createShow(
  payload: { show: Show },
  callbacks: SaveCallbacks,
  user: Auth.Model
): Promise<Msg> {
  return fetch(`/api/shows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(user)
    },
    body: JSON.stringify(payload.show)
  })
    .then((res) => {
      redirectIfUnauthorized(res);
      if (res.status !== 201) {
        throw new Error(`Create failed (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((created: Show): Msg => {
      callbacks.onSuccess?.();
      return ["show/created", { show: created }];
    })
    .catch((err: Error): Msg => {
      callbacks.onFailure?.(err);
      return ["noop"];
    });
}
