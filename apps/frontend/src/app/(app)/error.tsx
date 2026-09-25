"use client";

import { useEffect } from "react";
import ErrorState from "@/components/errors/ErrorState";
import { primaryButtonClass } from "@/components/ui/Page";

// Inside the app: keeps the sidebar and nav around the error, so people can navigate away
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
