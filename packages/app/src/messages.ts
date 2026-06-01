import { Show } from "server/models";

export type Msg =
  | ["shows/request"]
  | ["shows/loaded", { shows: Show[] }]
  | ["show/request", { id: string }]
  | ["show/loaded", { show: Show }];
