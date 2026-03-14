import type { WasteBurnEvent, WasteClassification } from "./types";

export function getDisplayClassification(
  event: WasteBurnEvent
): WasteClassification {
  return event.classification;
}

