import { Schema, model } from "mongoose";
import { Venue } from "../models/index.ts";

const venueSchema = new Schema<Venue>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    city: String
  },
  { collection: "concerto_venues" }
);

const VenueModel = model<Venue>("Venue", venueSchema);

function index(): Promise<Venue[]> {
  return VenueModel.find();
}

function get(id: string): Promise<Venue | null> {
  return VenueModel.findOne({ id });
}

export default { index, get };
