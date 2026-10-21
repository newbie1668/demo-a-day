export function EmptyGallery() {
  return (
    <div className="rounded-2xl bg-white/5 px-6 py-16 text-center ring-1 ring-white/10">
      <h2 className="font-heading text-3xl tracking-tight">Nothing shipped yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        The queue is scored. The first demo still has to land.
      </p>
    </div>
  );
}
