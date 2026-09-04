/**
 * Guilloché — the rose-engine line work printed on secured documents.
 *
 * Here it is not ornament. The pattern is a deterministic hypotrochoid whose
 * lobe count, amplitude and phase are derived from the identity's own id, so
 * two operators can never carry the same figure and the same operator carries
 * the same figure in every room, on every device. It is a visual hash.
 */

const cache = new Map<string, string>();

function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Hypotrochoid: a fixed outer circle R, a rolling inner circle r, pen at d. */
function trace(lobes: number, d: number, phase: number, scale: number, steps: number): string {
  const R = 46 * scale;
  const r = R / lobes;
  const pen = r * d;
  let path = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = phase + (i / steps) * Math.PI * 2;
    const x = (R - r) * Math.cos(t) + pen * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - pen * Math.sin(((R - r) / r) * t);
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${path}Z`;
}

function figure(seed: string, detail: number): string {
  const key = `${seed}:${detail}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const h = hash(seed || "unissued");
  const lobes = 5 + (h % 9); // 5–13 lobes
  const amplitude = 1.35 + ((h >>> 8) % 55) / 100; // pen well outside the roller
  const spin = (((h >>> 16) % 360) * Math.PI) / 180;
  const steps = detail > 1 ? 260 : 130;

  let d = "";
  for (let i = 0; i < detail; i += 1) {
    d += trace(lobes, amplitude, spin + i * 0.09, 1 - i * 0.11, steps);
  }
  cache.set(key, d);
  return d;
}

type GuillocheProps = {
  seed: string;
  /** Number of nested traces. 1 for inline chips, 4 for issued credentials. */
  detail?: number;
  className?: string;
  opacity?: number;
};

export function Guilloche({ seed, detail = 4, className, opacity = 0.85 }: GuillocheProps) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={figure(seed, detail)}
        fill="none"
        stroke="currentColor"
        strokeWidth={detail > 1 ? 0.5 : 0.8}
        strokeLinejoin="round"
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
