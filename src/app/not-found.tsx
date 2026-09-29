import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function RootNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 text-center">
      <Link href="/" aria-label="Auryx Software, Home">
        <Logo />
      </Link>
      <h1 className="mt-10 text-3xl font-bold">Off course, page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link href="/" className="btn-navy mt-8">
        Back to Home
      </Link>
    </main>
  );
}
