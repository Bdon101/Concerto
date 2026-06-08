import { Schema, model } from "mongoose";
import { Show } from "../models/index.ts";
import { deleteImageByUrl } from "../routes/images.ts";

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
    memoryText: String,
    rating: Number,
    photos: [String],
    coverImage: String,
    ownerUsername: { type: String, required: true },
    sharedWith: { type: [String], default: [] }
  },
  { collection: "concerto_shows" }
);

const ShowModel = model<Show>("Show", showSchema);

// Fields a client must never set/overwrite directly — ownership and the
// share list are managed server-side via the share-request flow.
const PROTECTED_FIELDS = ["ownerUsername", "sharedWith"] as const;

function stripProtected(show: Show): Show {
  const copy = { ...show };
  for (const field of PROTECTED_FIELDS) delete copy[field];
  return copy;
}

// All shows the user owns or has been granted read-only access to.
function index(username: string): Promise<Show[]> {
  return ShowModel.find({
    $or: [{ ownerUsername: username }, { sharedWith: username }]
  });
}

// Lookup by id only — the route enforces owner-or-shared access.
function get(id: string): Promise<Show | null> {
  return ShowModel.findOne({ id });
}

function create(json: Show, owner: string): Promise<Show> {
  const s = new ShowModel({
    ...stripProtected(json),
    ownerUsername: owner,
    sharedWith: []
  });
  return s.save();
}

// All image URLs a show references (cover + gallery photos).
function imageUrls(show: Show): string[] {
  const urls: string[] = [];
  if (show.coverImage) urls.push(show.coverImage);
  if (show.photos) urls.push(...show.photos);
  return urls;
}

// Owner-only: shared viewers are read-only, so a non-owner match yields none.
// On save, any image the show no longer references (a removed photo or a
// replaced cover) is deleted from disk so uploads don't accumulate.
function update(id: string, show: Show, owner: string): Promise<Show> {
  return ShowModel.findOne({ id, ownerUsername: owner }).then((existing) => {
    if (!existing) throw `${id} not updated`;
    const oldUrls = imageUrls(existing as Show);

    return ShowModel.findOneAndUpdate(
      { id, ownerUsername: owner },
      stripProtected(show),
      { new: true }
    ).then((updated) => {
      if (!updated) throw `${id} not updated`;
      const stillUsed = new Set(imageUrls(updated as Show));
      const removed = oldUrls.filter((url) => !stillUsed.has(url));
      // Fire-and-forget: don't block the response on disk cleanup.
      removed.forEach((url) => void deleteImageByUrl(url));
      return updated as Show;
    });
  });
}

// Owner-only delete.
function remove(id: string, owner: string): Promise<void> {
  return ShowModel.findOneAndDelete({ id, ownerUsername: owner }).then(
    (deleted) => {
      if (!deleted) throw `${id} not deleted`;
    }
  );
}

// Grant a user read-only access to a show (used when a share request is
// accepted). Idempotent via $addToSet.
function share(id: string, username: string): Promise<Show | null> {
  return ShowModel.findOneAndUpdate(
    { id },
    { $addToSet: { sharedWith: username } },
    { new: true }
  );
}

export default { index, get, create, update, remove, share };
