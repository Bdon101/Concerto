import express from "express";
import { connect } from "./services/mongo.ts";
import auth, { authenticateUser } from "./routes/auth.ts";
import shows from "./routes/shows.ts";

connect("concerto");

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));
app.use(express.json());

app.use("/auth", auth);
app.use("/api/shows", authenticateUser, shows);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
