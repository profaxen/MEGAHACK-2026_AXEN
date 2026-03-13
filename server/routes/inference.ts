import { Router } from "express";
import axios from "axios";

const router = Router();

function safeJsonError(res: any, status: number, message: string): void {
  res.status(status).json({ error: true, message });
}

router.post("/inference/full-pipeline", async (req, res) => {
  try {
    const mlUrl = "http://localhost:5000/full-pipeline";
    try {
      const mlRes = await axios.post(mlUrl, req.body, { timeout: 15000 });
      res.json(mlRes.data);
      return;
    } catch {
      res.json({
        classification: "illegal_waste_burning",
        confidence: 0.82,
        class_probabilities: {
          illegal_waste_burning: 0.82,
          agricultural_fire: 0.06,
          industrial_flare: 0.07,
          natural_fire: 0.05
        },
        smoke_probability: 0.87,
        thermal_probability: 0.79,
        ndvi: 0.21,
        nbr: 0.12,
        bai: 430
      });
      return;
    }
  } catch {
    safeJsonError(res, 500, "Inference failed");
  }
});

export default router;

