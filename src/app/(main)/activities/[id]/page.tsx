export const instant = false;

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-3xl rounded-[20px] border border-line bg-surface p-8">
      <p className="text-sm font-semibold text-ok">Activity created</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold text-ink">Your activity is live</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Activity details are coming next, but your new activity has been created successfully.
      </p>
      <p className="mt-6 rounded-xl bg-surface-2 px-4 py-3 font-mono text-sm text-ink">
        Activity ID: {id}
      </p>
    </section>
  );
}
