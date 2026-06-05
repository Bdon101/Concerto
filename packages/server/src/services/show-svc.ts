import { Schema, model } from "mongoose";
import { Show } from "../models/index.ts";

const showSchema = new Schema<Show>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    date: String,
    datetime: String,
    venue: String,
    href: String,
    artistName: String,
    songs: [String],
    memoryText: String
  },
  { collection: "concerto_shows" }
);

const ShowModel = model<Show>("Show", showSchema);

function index(): Promise<Show[]> {
  return ShowModel.find();
}

function get(id: string): Promise<Show | null> {
  return ShowModel.findOne({ id });
}

function create(json: Show): Promise<Show> {
  const s = new ShowModel(json);
  return s.save();
}

function update(id: string, show: Show): Promise<Show> {
  return ShowModel.findOneAndUpdate({ id }, show, { new: true }).then(
    (updated) => {
      if (!updated) throw `${id} not updated`;
      return updated as Show;
    }
  );
}

function remove(id: string): Promise<void> {
  return ShowModel.findOneAndDelete({ id }).then((deleted) => {
    if (!deleted) throw `${id} not deleted`;
  });
}

export default { index, get, create, update, remove };
