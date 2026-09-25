import { roundedHexagonPath } from "@/lib/hexagon";

const HEX = roundedHexagonPath(50, 50, 46, 12);

/** Bea's face: a warm honey hexagon with her initial. */
function BeaAvatar({ size = 36 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="bea-honey" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path d={HEX} style={{ fill: "url(#bea-honey)" }} />
      </svg>
      <span className="relative font-bnt leading-none text-[#3b2a06]" style={{ fontSize: size * 0.5 }}>
        B
      </span>
    </span>
  );
}

export default BeaAvatar;
