import { roundedHexagonPath } from "@/lib/hexagon";

const HEX = roundedHexagonPath(50, 50, 38, 10);

interface HobbyGlyphProps {
  color: string;
  size?: number;
  className?: string;
}

function HobbyGlyph({ color, size = 16, className }: HobbyGlyphProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path d={HEX} fill={color} />
    </svg>
  );
}

export default HobbyGlyph;
