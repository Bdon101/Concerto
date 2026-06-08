import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// Where uploaded image bytes are written. Served back out via
// express.static("/images") wired up in index.ts.
export const IMAGES_DIR = path.resolve(
  process.env.IMAGES_DIR || "uploads/images"
);

// Allowed content types mapped to the extension we save under.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_UPLOAD = "8mb";

const router = express.Router();

// POST /api/images  — raw image bytes in the body, content-type header
// names the format. Writes the file under a UUID name and returns its URL.
router.post(
  "/",
  express.raw({ type: "image/*", limit: MAX_UPLOAD }),
  (req: Request, res: Response) => {
    const contentType = String(req.headers["content-type"] || "");
    const ext = EXT_BY_TYPE[contentType];
    if (!ext) {
      res.status(415).send(`Unsupported image type: ${contentType}`);
      return;
    }

    const body = req.body as Buffer;
    if (!body || body.length === 0) {
      res.status(400).send("Empty image body");
      return;
    }

    const name = `${randomUUID()}.${ext}`;
    const dest = path.join(IMAGES_DIR, name);

    writeFile(dest, body)
      .then(() => res.status(201).json({ url: `/images/${name}` }))
      .catch((err) => res.status(500).send(String(err)));
  }
);

export default router;
