"use client";

import { useEffect } from "react";
import ErrorState from "@/components/errors/ErrorState";
import { primaryButtonClass } from "@/components/ui/Page";

// Anything that crashes while rendering a page lands here instead of Next's default error screen
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="SOMETHING WENT WRONG"
      message="This page hit a snag on our side. Trying again usually fixes it."
      action={
        <button type="button" onClick={reset} className={primaryButtonClass}>
          Try again
        </button>
      }
    />
  );
}
