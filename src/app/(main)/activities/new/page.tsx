import { CreateActivityForm } from "@/components/activities/CreateActivityForm";
import { requireUser } from "@/lib/auth/session";

export default async function CreateActivityPage() {
  const currentUser = await requireUser();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-extrabold text-ink">Create activity</h1>
        <p className="max-w-2xl text-base text-muted">
          Takes about a minute. Share what you are planning, when it starts, and how many spots
          are open.
        </p>
      </div>

      <CreateActivityForm currentUser={currentUser} />
    </section>
  );
}
