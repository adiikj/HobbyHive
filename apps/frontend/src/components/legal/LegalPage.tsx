import Link from "next/link";

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="w-full bg-beige">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <Link href="/" className="font-quick text-sm font-semibold text-pink-600 hover:underline">
          Back to home
        </Link>

        <h1 className="font-bnt text-chblack text-4xl sm:text-5xl mt-6">{title}</h1>
        <p className="font-pop text-sm text-chblack/50 mt-3">Last updated: {updated}</p>

        <div className="font-pop text-chblack/80 mt-10 space-y-8 leading-relaxed [&_h2]:font-quick [&_h2]:font-bold [&_h2]:text-chblack [&_h2]:text-xl [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-pink-600 [&_a]:font-semibold [&_a]:hover:underline">
          {children}
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
