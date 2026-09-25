import type { ReactNode } from "react";
import { roundedHexagonPath } from "@/lib/hexagon";

/** Shared building blocks for in-app pages, so every screen sits on the same canvas, type scale, and surfaces. */

const WIDTHS = {
  narrow: "max-w-[640px]",
  default: "max-w-[880px]",
  wide: "max-w-[1080px]",
};

export function PageContainer({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-canvas font-pop">
      <div className={`mx-auto w-full ${WIDTHS[width]} px-4 pt-5 pb-16 sm:px-6 lg:px-8 lg:pt-10 ${className}`}>{children}</div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 font-quick text-xs font-bold uppercase tracking-[0.14em] text-chblack/45">{eyebrow}</p>
        )}
        <h1 className="font-bnt text-5xl leading-[0.9] text-chblack sm:text-6xl">{title.toUpperCase()}</h1>
        {subtitle && <p className="mt-2 text-sm text-chblack/60 sm:text-[15px]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Card({ children, className = "", as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</Tag>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-bnt text-2xl leading-none tracking-wide text-chblack">{children}</h2>
      {action}
    </div>
  );
}

const HEX = roundedHexagonPath(50, 50, 44, 12);

/** A hobby's emoji on a hexagon cell — the brand shape, tinted with the hobby colour. */
export function HexIcon({
  fill,
  icon,
  size = 40,
  className = "",
}: {
  fill: string;
  icon: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={HEX} style={{ fill }} />
      </svg>
      <span className="relative leading-none" style={{ fontSize: size * 0.45 }}>
        {icon}
      </span>
    </span>
  );
}

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-quick font-bold text-white transition-colors hover:bg-pink-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2 text-sm font-quick font-bold text-chblack transition-colors hover:bg-canvas disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-chblack placeholder:text-chblack/35 focus:outline-none focus:ring-2 focus:ring-brand";
