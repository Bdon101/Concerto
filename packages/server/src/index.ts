import express, { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { connect } from "./services/mongo.ts";
import auth, { authenticateUser } from "./routes/auth.ts";
import shows from "./routes/shows.ts";
import artists from "./routes/artists.ts";
import venues from "./routes/venues.ts";

connect("concerto");

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));
app.use(express.json());

app.use("/auth", auth);
app.use("/api/shows", authenticateUser, shows);
app.use("/api/artists", authenticateUser, artists);
app.use("/api/venues", authenticateUser, venues);

// SPA fallback: every /app/* URL serves the shell so the client-side
// router (and browser refresh on deep links) works.
app.use("/app", (_req: Request, res: Response) => {
  const indexHtml = path.resolve(staticDir, "index.html");
  fs.readFile(indexHtml, { encoding: "utf8" }).then((html) =>
    res.send(html)
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
