export type ShareStatus = "pending" | "accepted" | "declined";

// A request from one user to share read-only access to a show with another.
// On accept, the recipient's username is added to the show's sharedWith list.
export interface ShareRequest {
  id: string;
  showId: string;
  showTitle: string;
  fromUsername: string;
  toUsername: string;
  status: ShareStatus;
  createdAt: string;
}
