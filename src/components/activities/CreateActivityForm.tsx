"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import type { SessionUser } from "@/lib/auth/session";
import { CATEGORY_OPTIONS, DEFAULT_CATEGORY } from "@/lib/constants/categories";
import { createActivitySchema } from "@/lib/validation/activity";
import { ActivityPreviewCard } from "./ActivityPreviewCard";

type CreateActivityFormProps = {
  currentUser: Pick<SessionUser, "id" | "name" | "email">;
};

type FormState = {
  title: string;
  category: (typeof CATEGORY_OPTIONS)[number]["value"];
  description: string;
  startTime: string;
  location: string;
  capacity: number;
};

type FieldErrors = Record<string, string[] | undefined>;

const DEFAULT_FORM_STATE: FormState = {
  title: "",
  category: DEFAULT_CATEGORY,
  description: "",
  startTime: "",
  location: "",
  capacity: 4,
};

function toIsoDateTime(localDateTime: string) {
  if (!localDateTime) {
    return "";
  }

  const value = new Date(localDateTime);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toISOString();
}

function fieldClassName(hasError: boolean) {
  return [
    "min-h-12 w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink outline-none transition",
    hasError
      ? "border-danger focus-visible:ring-2 focus-visible:ring-danger"
      : "border-line focus-visible:ring-2 focus-visible:ring-primary",
  ].join(" ");
}

export function CreateActivityForm({ currentUser }: CreateActivityFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewStartTime = useMemo(() => toIsoDateTime(form.startTime), [form.startTime]);

  const setField = <Key extends keyof FormState>(field: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      startTime: toIsoDateTime(form.startTime),
      location: form.location,
      capacity: form.capacity,
    };

    const parsed = createActivitySchema.safeParse(payload);

    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/v1/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const body = (await response.json()) as {
        data?: { id: string };
        error?: { message?: string; fields?: FieldErrors };
      };

      if (!response.ok) {
        setErrors(body.error?.fields ?? {});
        setFormError(body.error?.message ?? "Couldn't post your activity.");
        return;
      }

      if (!body.data?.id) {
        setFormError("Couldn't post your activity.");
        return;
      }

      router.push(`/activities/${body.data.id}`);
    } catch {
      setFormError("Couldn't post your activity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <section className="rounded-[20px] border border-line bg-surface p-6 sm:p-8">
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
          <div className="space-y-3">
            <span className="block text-sm font-semibold text-ink">Category</span>
            <div aria-label="Category" className="flex flex-wrap gap-3" role="group">
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = form.category === option.value;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={[
                      "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-line bg-surface-2 text-muted",
                    ].join(" ")}
                    key={option.value}
                    onClick={() => setField("category", option.value)}
                    style={{
                      boxShadow: isSelected ? `inset 0 0 0 1px ${option.color}` : undefined,
                    }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink" htmlFor="title">
              Title
            </label>
            <input
              aria-describedby={errors.title ? "title-error" : undefined}
              className={fieldClassName(Boolean(errors.title))}
              id="title"
              maxLength={80}
              name="title"
              onChange={(event) => setField("title", event.target.value)}
              placeholder="What are you planning?"
              value={form.title}
            />
            {errors.title ? (
              <p className="text-sm text-danger" id="title-error">
                {errors.title[0]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink" htmlFor="startTime">
                Start time
              </label>
              <input
                aria-describedby={errors.startTime ? "startTime-error" : undefined}
                className={fieldClassName(Boolean(errors.startTime))}
                id="startTime"
                name="startTime"
                onChange={(event) => setField("startTime", event.target.value)}
                type="datetime-local"
                value={form.startTime}
              />
              {errors.startTime ? (
                <p className="text-sm text-danger" id="startTime-error">
                  {errors.startTime[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink" htmlFor="location">
                Location
              </label>
              <input
                aria-describedby={errors.location ? "location-error" : undefined}
                className={fieldClassName(Boolean(errors.location))}
                id="location"
                maxLength={120}
                name="location"
                onChange={(event) => setField("location", event.target.value)}
                placeholder="Where will you meet?"
                value={form.location}
              />
              {errors.location ? (
                <p className="text-sm text-danger" id="location-error">
                  {errors.location[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink" htmlFor="description">
              Description
            </label>
            <textarea
              aria-describedby={errors.description ? "description-error" : undefined}
              className={`${fieldClassName(Boolean(errors.description))} min-h-32 resize-y`}
              id="description"
              maxLength={500}
              name="description"
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Skill level, what to bring, or where exactly to meet"
              value={form.description}
            />
            {errors.description ? (
              <p className="text-sm text-danger" id="description-error">
                {errors.description[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink" htmlFor="capacity">
              Capacity
            </label>
            <div className="flex items-center gap-3">
              <button
                aria-label="Decrease capacity"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-lg font-semibold text-ink focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                disabled={form.capacity <= 2}
                onClick={() => setField("capacity", Math.max(2, form.capacity - 1))}
                type="button"
              >
                -
              </button>
              <input
                aria-describedby={errors.capacity ? "capacity-error" : "capacity-help"}
                className={`${fieldClassName(Boolean(errors.capacity))} max-w-24 text-center`}
                id="capacity"
                name="capacity"
                onChange={(event) => {
                  const nextValue = Number.parseInt(event.target.value, 10);
                  setField(
                    "capacity",
                    Number.isNaN(nextValue) ? form.capacity : Math.min(20, Math.max(2, nextValue)),
                  );
                }}
                type="number"
                value={form.capacity}
              />
              <button
                aria-label="Increase capacity"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-lg font-semibold text-ink focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                disabled={form.capacity >= 20}
                onClick={() => setField("capacity", Math.min(20, form.capacity + 1))}
                type="button"
              >
                +
              </button>
            </div>
            <p className="text-sm text-muted" id="capacity-help">
              2 to 20 people
            </p>
            {errors.capacity ? (
              <p className="text-sm text-danger" id="capacity-error">
                {errors.capacity[0]}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              className="min-h-12 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Posting activity..." : "Post activity"}
            </button>
            <span className="self-center text-sm text-muted">{currentUser.email}</span>
          </div>
        </form>
      </section>

      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm text-muted">Preview of your card</p>
        <ActivityPreviewCard
          capacity={form.capacity}
          category={form.category}
          description={form.description}
          hostName={currentUser.name}
          location={form.location}
          startTime={previewStartTime}
          title={form.title}
        />
      </aside>
    </div>
  );
}
