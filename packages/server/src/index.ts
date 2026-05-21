import express, { Request, Response } from "express";
import Shows from "./services/show-svc.ts";
import { connect } from "./services/mongo.ts";

connect("concerto");

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));
app.use(express.json());

app.get("/hello", (_req: Request, res: Response) => {
  res.send("Hello, World");
});

app.get("/api/shows/:id", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  Shows.get(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send();
    })
    .catch(() => res.status(404).send());
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
