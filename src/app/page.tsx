import { DemoCard } from "@/components/demo-card";
import { EmptyGallery } from "@/components/empty-gallery";
import { SiteHeader } from "@/components/site-header";
import { LondonHero } from "@/demos/isometric-london";
import { listDemos } from "@/lib/gallery";

export default function HomePage() {
  const demos = listDemos();

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative min-h-[100svh] overflow-hidden bg-[#0b1018]">
        <LondonHero />
        <SiteHeader overlay />
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-6 sm:pb-20">
          <p className="font-mono text-[11px] tracking-[0.28em] text-amber-100/80 uppercase">Foo Ming Li · London</p>
          <h1 className="mt-5 max-w-5xl font-heading text-[clamp(3.1rem,10vw,7.6rem)] leading-[0.88] tracking-tight text-foreground">
            I ship one bookmark a day.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-foreground/72 sm:text-lg">
            One X bookmark. One working demo in the browser. Newest first.
          </p>
        </div>
      </section>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-5 py-16 sm:px-6">
        {demos.length === 0 ? (
          <EmptyGallery />
        ) : (
          <section className="grid gap-12 md:grid-cols-2">
            {demos.map((demo, index) => (
              <DemoCard key={demo.slug} demo={demo} featured={index === 0} />
            ))}
          </section>
        )}
      </main>
      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 font-mono text-[11px] text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>Foo Ming Li · London</p>
          <p>I build these in public, then I ship.</p>
        </div>
      </footer>
    </div>
  );
}
