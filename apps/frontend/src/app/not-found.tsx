import ErrorState from "@/components/errors/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      title="NOTHING HERE"
      message="Bea looked everywhere, but this page doesn't exist. It may have been moved or deleted."
    />
  );
}
