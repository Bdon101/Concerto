import { Show } from "server/models";

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
  | ["noop"];
