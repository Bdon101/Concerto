import express, { Request, Response } from "express";
import Shows from "./services/show-svc.ts";

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
  const data = Shows.get(id);

  if (data) {
    res.send(data);
    return;
  }

  res.status(404).send();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
