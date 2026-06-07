import { Show, Artist, Venue } from "server/models";

export interface SaveCallbacks {
  onSuccess?: () => void;
  onFailure?: (err: Error) => void;
}

export type Msg =
  | ["shows/request"]
  | ["shows/loaded", { shows: Show[] }]
  | ["show/request", { id: string }]
  | ["show/loaded", { show: Show }]
  | ["show/save", { id: string; show: Show }, SaveCallbacks]
  | ["show/create", { show: Show }, SaveCallbacks]
  | ["show/created", { show: Show }]
  | ["artists/request"]
  | ["artists/loaded", { artists: Artist[] }]
  | ["artist/request", { id: string }]
  | ["artist/loaded", { artist: Artist }]
  | ["venues/request"]
  | ["venues/loaded", { venues: Venue[] }]
  | ["venue/request", { id: string }]
  | ["venue/loaded", { venue: Venue }]
  | ["noop"];
