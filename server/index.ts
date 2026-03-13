import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events";
import reportsRouter from "./routes/reports";
import inferenceRouter from "./routes/inference";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "watchburn-server" });
});

app.use("/api", eventsRouter);
app.use("/api", reportsRouter);
app.use("/api", inferenceRouter);

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  // no console.log in production code per requirements
});

