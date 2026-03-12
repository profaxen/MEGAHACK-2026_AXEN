# WatchBurn — AI Illegal Waste Burning Detection System

WatchBurn combines 6 satellite systems with deep learning to identify illegal waste burning events in near real-time, giving environmental agencies actionable intelligence at planetary scale.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Recharts, Leaflet, Lucide React
- **Backend:** Express 5, TypeScript, Zod, CORS open
- **Database:** Firebase Firestore (free Spark plan)
- **ML Service:** FastAPI, PyTorch, scikit-learn, OpenCV

## Quick Start

```bash
pnpm install
pnpm dev
```

This starts the React frontend (Vite) on port 5173 and the Express backend on port 8080. Open http://localhost:5173.

## Optional: ML Service

```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

The ML service runs on port 5000. If it's not running, the inference endpoints return demo fallback results.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Client   │────▶│  Express API    │────▶│  Firebase       │
│  (Vite 5173)    │     │  (8080)         │     │  Firestore      │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       └──────────────▶ ML Service (5000)
         │
         └───────────────────────▶ Firebase SDK (onSnapshot)
```

## Folder Structure

```
watchburn/
├── client/          # React frontend
│   ├── components/  # Layout, Map, EventCard, SatelliteCanvas, etc.
│   ├── hooks/       # useCountUp, useEvents, useStats
│   ├── lib/         # types, firebase, api-client, mock-data
│   └── pages/       # Home, Dashboard, EventDetail, Analytics, Reports
├── server/          # Express backend
│   └── routes/      # events, reports, inference
├── ml_service/      # FastAPI + PyTorch ML
│   ├── models/      # U-Net, Thermal CNN, Fusion Classifier
│   └── utils/       # preprocessing, satellite_fetcher, event_clustering
└── package.json
```

## Firebase

WatchBurn uses Firebase Firestore for event storage. Credentials are hardcoded in `client/lib/firebase.ts`. On first run, if the `events` collection is empty, mock events are seeded automatically.

**Demo Mode:** If Firebase throws any error (e.g., network, permissions), the app automatically falls back to mock data. No manual setup required.

## NASA FIRMS

The ML service fetches VIIRS hotspots from NASA FIRMS. The API key is hardcoded in `ml_service/utils/satellite_fetcher.py`. On API failure, synthetic demo hotspots are returned.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | List events (filters: classification, status, confidence_min) |
| GET | /api/events/stats | Aggregated stats |
| GET | /api/events/trends?days=30 | Daily detection trends |
| GET | /api/events/:id | Single event |
| POST | /api/events/:id/verify | Update event status |
| POST | /api/inference/full-pipeline | Run full ML pipeline |
| GET | /api/reports/csv | Export events as CSV |
| GET | /api/reports/geojson | Export events as GeoJSON |

## Example API Response

**GET /api/events/stats**

```json
{
  "total": 100,
  "high_risk": 25,
  "verified": 40,
  "pending": 55,
  "coverage_km2": 125000
}
```

**POST /api/inference/full-pipeline**

```json
{
  "classification": "illegal_waste_burning",
  "confidence": 0.82,
  "class_probabilities": {
    "illegal_waste_burning": 0.82,
    "agricultural_fire": 0.08,
    "industrial_flare": 0.06,
    "natural_fire": 0.04
  },
  "smoke_probability": 0.78,
  "thermal_score": 0.85,
  "processing_time_ms": 120
}
```

## License

MIT
