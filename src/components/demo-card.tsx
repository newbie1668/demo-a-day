import Link from "next/link";
import type { GalleryDemo } from "@/lib/domain";

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DemoCard({ demo, featured = false }: { demo: GalleryDemo; featured?: boolean }) {
  return (
    <article className={featured ? "col-span-full" : ""}>
      <Link href={`/demos/${demo.slug}`} className="group block">
        <div
          className={`overflow-hidden rounded-2xl bg-[#0b1018] ring-1 ring-white/10 transition group-hover:ring-amber-200/35 ${
            featured ? "aspect-[16/8] sm:aspect-[21/9]" : "aspect-[16/10]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={demo.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="px-1 pt-4">
          <p className="font-mono text-[11px] tracking-[0.18em] text-amber-100/80 uppercase">{formatDate(demo.date)}</p>
          <h2 className={`mt-2 font-heading tracking-tight text-foreground ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}>
            {demo.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/75 sm:text-base">{demo.pitch}</p>
        </div>
      </Link>
      <p className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[11px] text-muted-foreground">
        <a href={demo.sourceUrl} className="hover:text-amber-100" target="_blank" rel="noreferrer">
          @{demo.author}
        </a>
        <Link href={`/demos/${demo.slug}`} className="text-foreground/80 hover:text-amber-100">
          Open demo
        </Link>
      </p>
    </article>
  );
}
