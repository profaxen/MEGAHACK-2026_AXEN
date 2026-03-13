import express from "express";
import cors from "cors";
import path from "path";
import eventsRouter from "./routes/events";
import reportsRouter from "./routes/reports";
import inferenceRouter from "./routes/inference";

const isProduction = process.env.NODE_ENV === "production";

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

if (isProduction) {
  const distPath = path.join(path.dirname(__dirname), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const port = Number(process.env.PORT) || 8080;

app.listen(port, () => {
  // no console.log in production code per requirements
});

