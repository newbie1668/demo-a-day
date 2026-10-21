import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col gap-4 px-6 py-24">
      <p className="font-mono text-[11px] tracking-[0.2em] text-amber-200/80 uppercase">404</p>
      <h1 className="font-heading text-4xl">That demo is not in the gallery</h1>
      <p className="text-muted-foreground">The slug is missing from src/generated/demos.json.</p>
      <Link href="/" className="font-mono text-sm text-amber-200 hover:text-amber-100">
        ← Gallery
      </Link>
    </main>
  );
}
