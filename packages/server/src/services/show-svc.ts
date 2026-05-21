import { Schema, model } from "mongoose";
import { Show } from "../models/index.ts";

const showSchema = new Schema<Show>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    date: String,
    datetime: String,
    venue: String,
    href: String
  },
  { collection: "concerto_shows" }
);

const ShowModel = model<Show>("Show", showSchema);

function index(): Promise<Show[]> {
  return ShowModel.find();
}

function get(id: string): Promise<Show | null> {
  return ShowModel.findOne({ id })
    .catch((err) => {
      throw `Show ${id} not found`;
    });
}

export default { index, get };
