import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

export function DemoCard({ demo }: { demo: GalleryDemo }) {
  return (
    <Card className="bg-card/80 ring-foreground/8 transition-colors hover:ring-amber-200/30">
      <Link href={`/demos/${demo.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={demo.thumbnail} alt="" className="h-full w-full object-cover" />
        </div>
        <CardHeader className="pt-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">{formatDate(demo.date)}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">/{demo.slug}</span>
          </div>
          <CardTitle className="font-heading text-2xl">{demo.title}</CardTitle>
          <CardDescription>{demo.pitch}</CardDescription>
        </CardHeader>
      </Link>
      <CardContent className="text-xs leading-5 text-muted-foreground">{demo.howBuilt}</CardContent>
      <CardFooter className="justify-between gap-3 text-xs">
        <a
          href={demo.sourceUrl}
          className="font-mono text-amber-200/90 hover:text-amber-100"
          target="_blank"
          rel="noreferrer"
        >
          @{demo.author} · x.com/i/status/{demo.bookmarkId}
        </a>
        <Link href={`/demos/${demo.slug}`} className="text-foreground hover:text-amber-200">
          Open demo
        </Link>
      </CardFooter>
    </Card>
  );
}
