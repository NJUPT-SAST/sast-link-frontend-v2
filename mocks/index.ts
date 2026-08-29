// React StrictMode double-invokes effects in dev, which would race two
// worker.start() calls — the second one throws "cannot configure an already
// enabled network". A module-level guard makes initMocks idempotent.
let started = false;

export async function initMocks() {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "true") return;
  if (started) return;
  started = true;

  const { worker } = await import("./browser");
  await worker.start({
    onUnhandledRequest: "bypass",
  });
}
