"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Details are logged server-side; only the digest is shown for support.
    console.error("Page error", error.digest);
  }, [error]);

  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        Sorry, we couldn&apos;t load this page. Please try again, or contact us directly at{" "}
        <a className="font-medium text-navy-700 underline" href="mailto:info@auryx.net">
          info@auryx.net
        </a>
        .
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-navy">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
