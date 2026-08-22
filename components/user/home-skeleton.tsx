export function HomeSkeleton() {
  return (
    <section
      data-testid="home-skeleton"
      className="flex min-h-[calc(100dvh-4rem)] snap-start flex-col items-center justify-center px-5 text-center sm:px-8"
    >
      <div className="flex max-w-xl flex-col items-center gap-5">
        <div className="skeleton skeleton-shimmer h-4 w-32" />
        <div className="skeleton skeleton-shimmer h-10 w-64" />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="skeleton skeleton-shimmer h-12 w-24" />
        </div>
      </div>
    </section>
  );
}
