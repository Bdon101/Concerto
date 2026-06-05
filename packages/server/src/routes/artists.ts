import express, { Request, Response } from "express";
import Artists from "../services/artist-svc.ts";
import { Artist } from "../models/index.ts";

const router = express.Router();

// GET all
router.get("/", (_req: Request, res: Response) => {
  Artists.index()
    .then((artists: Artist[]) => res.json(artists))
    .catch((err) => res.status(500).send(err));
});

// GET by id
router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Artists.get(id)
    .then((artist) => {
      if (!artist) {
        res.status(404).end();
        return;
      }
      res.json(artist);
    })
    .catch(() => res.status(404).end());
});

export default router;
