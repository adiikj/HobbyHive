"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

const LEGAL_PAGES = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/community-guidelines", label: "Guidelines" },
];

interface Heading {
  id: string;
  text: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function LegalPage({ title, updated, children }: LegalPageProps) {
  const pathname = usePathname();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Build the table of contents from the page's own <h2>s, and track which one is on screen
  useEffect(() => {
    const els = Array.from(bodyRef.current?.querySelectorAll("h2") ?? []);
    els.forEach((el) => {
      if (!el.id) el.id = slugify(el.textContent ?? "");
    });
    setHeadings(els.map((el) => ({ id: el.id, text: el.textContent ?? "" })));
    setActiveId(els[0]?.id ?? null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-beige">
      <div className="relative overflow-hidden bg-gradient-to-r from-somig to-beige">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14">
          <Link href="/" className="inline-flex items-center gap-1 font-quick text-sm font-semibold text-chblack/55 hover:text-chblack">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <h1 className="mt-6 font-bnt text-5xl leading-none text-chblack sm:text-6xl">{title}</h1>
          <p className="mt-3 font-pop text-sm text-chblack/55">Last updated {updated}</p>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Legal pages">
            {LEGAL_PAGES.map((p) => {
              const active = pathname === p.href;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 font-quick text-sm font-semibold transition-colors ${
                    active ? "bg-chblack text-white" : "bg-white/70 text-chblack/65 hover:bg-white hover:text-chblack"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          {headings.length > 0 && (
            <nav className="sticky top-24" aria-label="On this page">
              <p className="font-quick text-xs font-bold uppercase tracking-[0.16em] text-chblack/40">On this page</p>
              <ul className="mt-3 space-y-1 border-l border-chblack/10">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`-ml-px block border-l-2 py-1 pl-3 font-pop text-sm transition-colors ${
                        activeId === h.id ? "border-pink-600 font-semibold text-chblack" : "border-transparent text-chblack/55 hover:text-chblack"
                      }`}
                    >
                      {h.text.replace(/^\d+\.\s*/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <div>
          <div
            ref={bodyRef}
            className="rounded-3xl bg-white p-6 font-pop leading-relaxed text-chblack/80 shadow-sm sm:p-10 [&_a]:font-semibold [&_a]:text-pink-600 [&_a]:hover:underline [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:font-quick [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-chblack [&_section+section]:mt-6 [&_section+section]:border-t [&_section+section]:border-chblack/5 [&_section+section]:pt-6 [&_strong]:text-chblack [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-pink-500"
          >
            {children}
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-3xl bg-chblack px-6 py-5 text-white sm:flex-row sm:items-center sm:px-8">
            <p className="font-pop text-sm text-white/75">Still have questions? We&apos;re happy to help.</p>
            <a
              href="mailto:contactus@hobbyhive.com"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-quick text-sm font-bold text-chblack hover:bg-pink-50"
            >
              <Mail size={15} /> contactus@hobbyhive.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
