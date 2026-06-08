import express, { Response } from "express";
import Shows from "../services/show-svc.ts";
import { Show } from "../models/index.ts";
import { AuthedRequest } from "./auth.ts";

const router = express.Router();

// True when the user owns the show or has been granted read-only access.
function canView(show: Show, user: string): boolean {
  return show.ownerUsername === user || (show.sharedWith ?? []).includes(user);
}

// GET all (owned + shared-with-me)
router.get("/", (req: AuthedRequest, res: Response) => {
  Shows.index(req.user as string)
    .then((shows: Show[]) => res.json(shows))
    .catch((err) => res.status(500).send(err));
});

// GET by id — owner or shared viewer only; others get 404 (no leak).
router.get("/:id", (req: AuthedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Shows.get(id)
    .then((show) => {
      if (!show || !canView(show, req.user as string)) {
        res.status(404).end();
        return;
      }
      res.json(show);
    })
    .catch(() => res.status(404).end());
});

// POST (create) — stamps the caller as owner
router.post("/", (req: AuthedRequest, res: Response) => {
  const newShow = req.body as Show;
  Shows.create(newShow, req.user as string)
    .then((show: Show) => res.status(201).json(show))
    .catch((err) => res.status(500).send(err));
});

// PUT (update) — owner only
router.put("/:id", (req: AuthedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const newShow = req.body as Show;
  Shows.update(id, newShow, req.user as string)
    .then((show) => res.json(show))
    .catch(() => res.status(404).end());
});

// DELETE — owner only
router.delete("/:id", (req: AuthedRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Shows.remove(id, req.user as string)
    .then(() => res.status(204).end())
    .catch((err) => res.status(404).send(err));
});

export default router;
