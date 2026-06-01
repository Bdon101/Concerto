import { Show } from "server/models";

export interface Model {
  shows?: Show[];
  show?: Show;
}

export const init: Model = {};
