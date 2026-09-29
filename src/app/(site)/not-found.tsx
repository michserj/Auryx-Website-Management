import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Compass className="h-12 w-12 text-gold-500" aria-hidden />
      <h1 className="mt-6 text-3xl font-bold">Off course, page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-navy">
          Back to Home
        </Link>
        <Link href="/contact" className="btn-outline">
          Contact us
        </Link>
      </div>
    </section>
  );
}
