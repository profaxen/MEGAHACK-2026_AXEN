/**
 * Seeded RNG for deterministic canvas rendering.
 * Same event.id always produces the same random sequence.
 */
export function hashSeed(str: string): number {
  let h = 0;
  for (const c of str) {
    h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  }
  return Math.abs(h);
}

export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
