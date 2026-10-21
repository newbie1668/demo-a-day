import demosFile from "@/generated/demos.json";
import { asBookmarkId, asDemoSlug, type GalleryDemo } from "@/lib/domain";

type DemoJson = {
  slug: string;
  bookmarkId: string;
  title: string;
  pitch: string;
  date: string;
  thumbnail: string;
  howBuilt: string;
  author: string;
  sourceUrl: string;
};

function parseDemo(row: DemoJson): GalleryDemo {
  return {
    slug: asDemoSlug(row.slug),
    bookmarkId: asBookmarkId(row.bookmarkId),
    title: row.title,
    pitch: row.pitch,
    date: row.date,
    thumbnail: row.thumbnail,
    howBuilt: row.howBuilt,
    author: row.author,
    sourceUrl: row.sourceUrl,
  };
}

const demos: GalleryDemo[] = (demosFile.demos as DemoJson[]).map(parseDemo).slice().reverse();

export function listDemos(): GalleryDemo[] {
  return demos;
}

export function getDemo(slug: string): GalleryDemo | null {
  return demos.find((demo) => demo.slug === slug) ?? null;
}
