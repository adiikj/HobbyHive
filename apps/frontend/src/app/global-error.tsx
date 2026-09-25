"use client";

// Last resort, when the root layout itself fails: no app styles are guaranteed here, so it's styled inline
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F7F7F5", color: "#1F2024" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/bea.svg" alt="" width={88} height={88} />
          <h1 style={{ fontSize: 28, margin: "20px 0 8px" }}>Something went wrong</h1>
          <p style={{ maxWidth: 420, opacity: 0.7, margin: 0 }}>HobbyHive hit a snag on our side. Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "10px 20px", borderRadius: 999, border: "none", background: "#DB2777", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
