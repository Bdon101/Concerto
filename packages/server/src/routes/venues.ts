import express, { Request, Response } from "express";
import Venues from "../services/venue-svc.ts";
import { Venue } from "../models/index.ts";

const router = express.Router();

// GET all
router.get("/", (_req: Request, res: Response) => {
  Venues.index()
    .then((venues: Venue[]) => res.json(venues))
    .catch((err) => res.status(500).send(err));
});

// GET by id
router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Venues.get(id)
    .then((venue) => {
      if (!venue) {
        res.status(404).end();
        return;
      }
      res.json(venue);
    })
    .catch(() => res.status(404).end());
});

export default router;
