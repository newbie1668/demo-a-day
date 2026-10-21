export type BookmarkId = string & { readonly __brand: "BookmarkId" };
export type DemoSlug = string & { readonly __brand: "DemoSlug" };
export type DemoAbility = 0 | 1 | 2 | 3 | 4 | 5;
export type Theme =
  | "city-map"
  | "agent"
  | "ai-in-software"
  | "career"
  | "ai-video"
  | "other";

export type QueueStatus = "pending" | "built" | "skipped";

type QueueItemBase = {
  id: BookmarkId;
  author: string;
  authorName: string;
  createdAt: string;
  sourceUrl: string;
  theme: Theme;
  demoAbility: DemoAbility;
  summary: string;
};

export type PendingItem = QueueItemBase & {
  status: "pending";
  suggestedDemo: string;
  skipReason: null;
};

export type BuiltItem = QueueItemBase & {
  status: "built";
  slug: DemoSlug;
  suggestedDemo: string | null;
  skipReason: null;
  builtAt: string;
};

export type SkippedItem = QueueItemBase & {
  status: "skipped";
  skipReason: string;
  suggestedDemo: null;
};

export type QueueItem = PendingItem | BuiltItem | SkippedItem;

export type GalleryDemo = {
  slug: DemoSlug;
  bookmarkId: BookmarkId;
  title: string;
  pitch: string;
  date: string;
  thumbnail: string;
  howBuilt: string;
  author: string;
  sourceUrl: string;
};

export function isDemoAbility(value: number): value is DemoAbility {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function asBookmarkId(value: string): BookmarkId {
  if (!/^\d+$/.test(value)) {
    throw new Error(`not a bookmark id: ${value}`);
  }
  return value as BookmarkId;
}

export function asDemoSlug(value: string): DemoSlug {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`not a demo slug: ${value}`);
  }
  return value as DemoSlug;
}
