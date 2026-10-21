import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DemoBody } from "@/demos/renders";
import { getDemo, listDemos } from "@/lib/gallery";

export async function generateStaticParams() {
  return listDemos().map((demo) => ({ slug: demo.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) return { title: "Demo not found" };
  return {
    title: `${demo.title} · Demo a Day`,
    description: demo.pitch,
  };
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-amber-100/90 hover:text-amber-50">
            ← Gallery
          </Link>
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-[11px] tracking-[0.2em] text-amber-100/70 uppercase">{demo.date}</p>
            <h1 className="font-heading text-4xl tracking-tight sm:text-6xl">{demo.title}</h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">{demo.pitch}</p>
          </div>
          <a
            href={demo.sourceUrl}
            className="font-mono text-xs text-amber-100/90 hover:text-amber-50"
            target="_blank"
            rel="noreferrer"
          >
            @{demo.author}
          </a>
        </div>
        <DemoBody slug={slug} />
        <section className="max-w-2xl pb-10">
          <h2 className="font-heading text-2xl tracking-tight">How I built it</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{demo.howBuilt}</p>
        </section>
      </main>
    </div>
  );
}
