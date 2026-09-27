/** Instant feedback while a server-rendered page loads, so a tapped link never looks dead. */
export function PageLoading({ label }: { label: string }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-blue" aria-hidden />
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-muted">{label}</p>
      </div>
    </main>
  );
}
