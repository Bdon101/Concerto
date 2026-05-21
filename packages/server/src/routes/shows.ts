import express, { Request, Response } from "express";
import Shows from "../services/show-svc.ts";
import { Show } from "../models/index.ts";

const router = express.Router();

// GET all
router.get("/", (_req: Request, res: Response) => {
  Shows.index()
    .then((shows: Show[]) => res.json(shows))
    .catch((err) => res.status(500).send(err));
});

// GET by id
router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Shows.get(id)
    .then((show) => {
      if (!show) {
        res.status(404).end();
        return;
      }
      res.json(show);
    })
    .catch(() => res.status(404).end());
});

// POST (create)
router.post("/", (req: Request, res: Response) => {
  const newShow = req.body as Show;
  Shows.create(newShow)
    .then((show: Show) => res.status(201).json(show))
    .catch((err) => res.status(500).send(err));
});

// PUT (update)
router.put("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const newShow = req.body as Show;
  Shows.update(id, newShow)
    .then((show) => res.json(show))
    .catch(() => res.status(404).end());
});

// DELETE
router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Shows.remove(id)
    .then(() => res.status(204).end())
    .catch((err) => res.status(404).send(err));
});

export default router;
