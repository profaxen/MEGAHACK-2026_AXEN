import express from "express";
import cors from "cors";
import { eventsRouter } from "./routes/events";
import { reportsRouter } from "./routes/reports";
import { inferenceRouter } from "./routes/inference";
import { geocodeRouter } from "./routes/geocode";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", eventsRouter);
app.use("/api", reportsRouter);
app.use("/api", inferenceRouter);
app.use("/api", geocodeRouter);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`WatchBurn API listening on http://localhost:${PORT}`);
});
