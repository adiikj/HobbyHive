import type { ReactNode } from "react";
import Link from "next/link";
import BeaAvatar from "@/components/bea/BeaAvatar";
import { secondaryButtonClass } from "@/components/ui/Page";

/** A full-page "something's off" message with Bea, used by the 404 page and error boundaries. */
function ErrorState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <BeaAvatar size={88} />
      <h1 className="mt-5 font-bnt text-5xl leading-none text-chblack sm:text-6xl">{title}</h1>
      <p className="mt-3 max-w-md text-chblack/65">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {action}
        <Link href="/dashboard" className={secondaryButtonClass}>
          Back to your hives
        </Link>
      </div>
    </main>
  );
}

export default ErrorState;
