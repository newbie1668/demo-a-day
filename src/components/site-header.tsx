import Link from "next/link";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-20" : "border-b border-white/8"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div>
          <Link href="/" className="font-heading text-2xl tracking-tight text-foreground">
            Demo a Day
          </Link>
          {overlay ? null : (
            <p className="mt-1 max-w-md text-sm leading-5 text-muted-foreground">
              I turn one X bookmark into a working demo.
            </p>
          )}
        </div>
        <nav className="flex flex-wrap justify-end gap-x-5 gap-y-1 font-mono text-xs text-foreground/70">
          <a href="https://x.com/fooming86" className="hover:text-amber-100">
            @fooming86
          </a>
          <a href="https://londonstartupmap.com" className="hover:text-amber-100">
            londonstartupmap.com
          </a>
        </nav>
      </div>
    </header>
  );
}
