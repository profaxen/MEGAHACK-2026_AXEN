import { useEffect, useRef, useState } from "react";

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - 2 ** (-10 * x);
}

export function useCountUp(
  target: number,
  duration: number = 1500
): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number;

    const step = (timestamp: number): void => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const progress = Math.min(
        (timestamp - startRef.current) / duration,
        1
      );
      const eased = easeOutExpo(progress);
      setValue(target * eased);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
      startRef.current = null;
    };
  }, [target, duration]);

  return value;
}

export default useCountUp;

