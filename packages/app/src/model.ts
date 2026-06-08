import { Show, Artist, Venue, ShareRequest } from "server/models";

export interface Model {
  shows?: Show[];
  show?: Show;
  artists?: Artist[];
  artist?: Artist;
  venues?: Venue[];
  venue?: Venue;
  incomingRequests?: ShareRequest[];
}

export const init: Model = {};
