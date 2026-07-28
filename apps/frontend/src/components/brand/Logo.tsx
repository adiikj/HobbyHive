import { roundedHexagonPath } from "@/lib/hexagon";

const BIG_HEX = roundedHexagonPath(42, 58, 35, 9);
const SMALL_HEX = roundedHexagonPath(75, 23, 19, 5);

interface LogoProps {
  size?: number;
  className?: string;
}

function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="HobbyHive"
    >
      <path d={SMALL_HEX} fill="#ADE8E6" stroke="#F8F9FA" strokeWidth={3} strokeLinejoin="round" />
      <path d={BIG_HEX} fill="#DB2777" stroke="#F8F9FA" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

export default Logo;
