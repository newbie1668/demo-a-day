import Link from "next/link";

export function SiteHeader({ kicker }: { kicker?: string }) {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-[0.28em] text-amber-200/80 uppercase">
            {kicker ?? "London · daily"}
          </p>
          <Link href="/" className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
            Demo a Day
          </Link>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Foo Ming Li turns one X bookmark into a working browser demo. Public proof he can ship with AI
            agents, aimed at AI-native companies hiring senior PMs.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
          <a href="https://x.com/fooming86" className="hover:text-amber-200">
            @fooming86
          </a>
          <a href="https://londonstartupmap.com" className="hover:text-amber-200">
            londonstartupmap.com
          </a>
        </nav>
      </div>
    </header>
  );
}
