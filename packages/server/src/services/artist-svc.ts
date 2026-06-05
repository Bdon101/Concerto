import { Schema, model } from "mongoose";
import { Artist } from "../models/index.ts";

const artistSchema = new Schema<Artist>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String
  },
  { collection: "concerto_artists" }
);

const ArtistModel = model<Artist>("Artist", artistSchema);

function index(): Promise<Artist[]> {
  return ArtistModel.find();
}

function get(id: string): Promise<Artist | null> {
  return ArtistModel.findOne({ id });
}

export default { index, get };
