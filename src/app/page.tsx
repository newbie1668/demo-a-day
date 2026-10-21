import { DemoCard } from "@/components/demo-card";
import { EmptyGallery } from "@/components/empty-gallery";
import { SiteHeader } from "@/components/site-header";
import { listDemos } from "@/lib/gallery";

export default function HomePage() {
  const demos = listDemos();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <section className="max-w-2xl space-y-3">
          <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
            One bookmark. One working demo. Newest first.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Each card is a self-contained browser demo. No backend secrets. Source is the X bookmark that
            sparked it, linked as <span className="font-mono text-amber-200/90">x.com/i/status/id</span>.
          </p>
        </section>
        {demos.length === 0 ? (
          <EmptyGallery />
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {demos.map((demo) => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </section>
        )}
      </main>
      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>Foo Ming Li · senior PM · London</p>
          <p>Queue lives in data/queue.json. Pipeline: .cursor/skills/build-next-demo</p>
        </div>
      </footer>
    </div>
  );
}
