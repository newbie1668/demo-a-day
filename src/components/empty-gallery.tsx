import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyGallery() {
  return (
    <Card className="border-dashed bg-card/40">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">No demos shipped yet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>The queue is scored. Nothing has been marked built.</p>
        <p>
          A cloud agent should run <code className="font-mono text-amber-200">.cursor/skills/build-next-demo</code>{" "}
          and <code className="font-mono text-amber-200">node scripts/pick-next-demo.mjs</code>.
        </p>
      </CardContent>
    </Card>
  );
}
