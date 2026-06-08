import express, { Response } from "express";
import ShareRequests from "../services/share-request-svc.ts";
import Shows from "../services/show-svc.ts";
import credentials from "../services/credential-svc.ts";
import { AuthedRequest } from "./auth.ts";

const router = express.Router();

// POST / — tag a friend on a show you own.
// Body: { showId, toUsername }. Blocks: non-owner, self-tag, unknown
// username, already-shared, and duplicate pending requests.
router.post("/", (req: AuthedRequest, res: Response) => {
  const me = req.user as string;
  const { showId, toUsername } = req.body as {
    showId?: string;
    toUsername?: string;
  };

  if (typeof showId !== "string" || typeof toUsername !== "string") {
    res.status(400).send("Bad request: showId and toUsername are required.");
    return;
  }
  if (toUsername === me) {
    res.status(400).send("You can't tag yourself.");
    return;
  }

  Shows.get(showId)
    .then(async (show) => {
      if (!show || show.ownerUsername !== me) {
        res.status(404).send("Show not found.");
        return;
      }
      if ((show.sharedWith ?? []).includes(toUsername)) {
        res.status(409).send("That friend already has access.");
        return;
      }
      if (!(await credentials.exists(toUsername))) {
        res.status(404).send("No account with that username.");
        return;
      }
      if (await ShareRequests.pendingExists(showId, toUsername)) {
        res.status(409).send("You already invited that friend.");
        return;
      }
      const created = await ShareRequests.create({
        showId,
        showTitle: show.title,
        fromUsername: me,
        toUsername
      });
      res.status(201).json(created);
    })
    .catch((err) => res.status(500).send(String(err)));
});

// GET /incoming — my pending invites
router.get("/incoming", (req: AuthedRequest, res: Response) => {
  ShareRequests.incoming(req.user as string)
    .then((requests) => res.json(requests))
    .catch((err) => res.status(500).send(String(err)));
});

// POST /:id/accept — recipient grants themselves read-only access
router.post(
  "/:id/accept",
  (req: AuthedRequest<{ id: string }>, res: Response) => {
    const me = req.user as string;
    ShareRequests.get(req.params.id)
      .then(async (request) => {
        if (!request || request.toUsername !== me) {
          res.status(404).end();
          return;
        }
        if (request.status !== "pending") {
          res.status(409).send("Request is no longer pending.");
          return;
        }
        await Shows.share(request.showId, me);
        const updated = await ShareRequests.setStatus(request.id, "accepted");
        res.json(updated);
      })
      .catch((err) => res.status(500).send(String(err)));
  }
);

// POST /:id/decline — recipient rejects the invite
router.post(
  "/:id/decline",
  (req: AuthedRequest<{ id: string }>, res: Response) => {
    const me = req.user as string;
    ShareRequests.get(req.params.id)
      .then(async (request) => {
        if (!request || request.toUsername !== me) {
          res.status(404).end();
          return;
        }
        if (request.status !== "pending") {
          res.status(409).send("Request is no longer pending.");
          return;
        }
        const updated = await ShareRequests.setStatus(request.id, "declined");
        res.json(updated);
      })
      .catch((err) => res.status(500).send(String(err)));
  }
);

export default router;
