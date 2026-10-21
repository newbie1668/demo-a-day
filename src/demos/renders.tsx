import { BookmarkAgentLoop } from "@/demos/bookmark-agent-loop";
import { IsometricLondon } from "@/demos/isometric-london";

export function DemoBody({ slug }: { slug: string }) {
  switch (slug) {
    case "isometric-london":
      return <IsometricLondon />;
    case "bookmark-agent-loop":
      return <BookmarkAgentLoop />;
    default:
      return null;
  }
}
