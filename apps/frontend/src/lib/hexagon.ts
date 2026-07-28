function normalize([x, y]: [number, number]): [number, number] {
  const len = Math.sqrt(x * x + y * y) || 1;
  return [x / len, y / len];
}

function hexagonPoints(cx: number, cy: number, r: number, rotationDeg: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((rotationDeg + i * 60) * Math.PI) / 180;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return points;
}

/**
 * Builds an SVG path for a pointy-top regular hexagon with rounded corners,
 * using a quadratic bezier at each vertex.
 */
export function roundedHexagonPath(cx: number, cy: number, r: number, cornerRadius: number, rotationDeg = -90): string {
  const pts = hexagonPoints(cx, cy, r, rotationDeg);
  const n = pts.length;
  let d = "";

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];

    const toPrev = normalize([prev[0] - curr[0], prev[1] - curr[1]]);
    const toNext = normalize([next[0] - curr[0], next[1] - curr[1]]);

    const p1: [number, number] = [curr[0] + toPrev[0] * cornerRadius, curr[1] + toPrev[1] * cornerRadius];
    const p2: [number, number] = [curr[0] + toNext[0] * cornerRadius, curr[1] + toNext[1] * cornerRadius];

    d += i === 0 ? `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ` : `L ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} `;
    d += `Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }

  return `${d}Z`;
}
