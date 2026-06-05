import { Show, Artist, Venue } from "server/models";

export interface Model {
  shows?: Show[];
  show?: Show;
  artists?: Artist[];
  artist?: Artist;
  venues?: Venue[];
  venue?: Venue;
}

export const init: Model = {};
