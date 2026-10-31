import type { Category } from "@/generated/prisma/enums";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants/categories";
import { SeatDots } from "./SeatDots";

type ActivityPreviewCardProps = {
  title: string;
  category: Category;
  description: string;
  startTime: string;
  location: string;
  capacity: number;
  hostName: string;
};

function formatStartTime(startTime: string) {
  if (!startTime) {
    return "Pick a date and time";
  }

  const value = new Date(startTime);

  if (Number.isNaN(value.getTime())) {
    return "Pick a date and time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function ActivityPreviewCard({
  title,
  category,
  description,
  startTime,
  location,
  capacity,
  hostName,
}: ActivityPreviewCardProps) {
  const spotsLeft = Math.max(capacity - 1, 0);

  return (
    <article className="rounded-[20px] border border-line bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 rounded-full"
          style={{ backgroundColor: CATEGORY_COLORS[category] }}
        />
        <span className="text-sm font-semibold text-muted">{CATEGORY_LABELS[category]}</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted">{formatStartTime(startTime)}</p>
          <h2 className="font-heading text-2xl font-bold text-ink">
            {title || "Your activity title"}
          </h2>
        </div>

        <p className="text-sm text-muted">{location || "Add where you'll meet"}</p>

        <p className="text-sm leading-6 text-muted">
          {description || "Your description will help people decide to join."}
        </p>

        <div className="flex items-center justify-between gap-4">
          <SeatDots taken={1} total={capacity} />
          <span
            className={[
              "rounded-full px-3 py-1 text-sm font-semibold",
              spotsLeft === 1 ? "bg-sun text-sun-ink" : "bg-primary-soft text-primary",
            ].join(" ")}
          >
            {spotsLeft} spots left
          </span>
        </div>

        <p className="text-sm text-muted">Hosted by {hostName}</p>
      </div>
    </article>
  );
}
