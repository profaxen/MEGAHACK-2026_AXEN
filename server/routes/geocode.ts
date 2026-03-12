import { Router } from "express";
import { reverseGeocode } from "../geocode";

export const geocodeRouter = Router();

geocodeRouter.get("/geocode", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "Invalid lat/lon" });
  }

  const label = await reverseGeocode(lat, lon);
  if (!label) {
    return res.status(404).json({ error: "Location not found" });
  }

  res.json({ label });
});

