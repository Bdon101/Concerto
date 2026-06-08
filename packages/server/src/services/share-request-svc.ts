import { randomUUID } from "node:crypto";
import { Schema, model } from "mongoose";
import { ShareRequest } from "../models/index.ts";

const shareRequestSchema = new Schema<ShareRequest>(
  {
    id: { type: String, required: true, unique: true },
    showId: { type: String, required: true },
    showTitle: { type: String, required: true },
    fromUsername: { type: String, required: true },
    toUsername: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    createdAt: { type: String, required: true }
  },
  { collection: "concerto_share_requests" }
);

const ShareRequestModel = model<ShareRequest>(
  "ShareRequest",
  shareRequestSchema
);

interface CreateInput {
  showId: string;
  showTitle: string;
  fromUsername: string;
  toUsername: string;
}

function create(input: CreateInput): Promise<ShareRequest> {
  const req = new ShareRequestModel({
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString()
  });
  return req.save();
}

// True if a still-pending request already covers this show + recipient,
// so we don't create duplicate invites.
function pendingExists(
  showId: string,
  toUsername: string
): Promise<boolean> {
  return ShareRequestModel.findOne({
    showId,
    toUsername,
    status: "pending"
  }).then((found) => found != null);
}

// Pending requests addressed to a user — their inbox.
function incoming(username: string): Promise<ShareRequest[]> {
  return ShareRequestModel.find({
    toUsername: username,
    status: "pending"
  }).sort({ createdAt: -1 });
}

function get(id: string): Promise<ShareRequest | null> {
  return ShareRequestModel.findOne({ id });
}

function setStatus(
  id: string,
  status: ShareRequest["status"]
): Promise<ShareRequest | null> {
  return ShareRequestModel.findOneAndUpdate({ id }, { status }, { new: true });
}

export default { create, pendingExists, incoming, get, setStatus };
