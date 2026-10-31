"use client";

import {
  activityCategoryOptions,
  createActivitySchema,
  getCreateActivityFieldErrors,
  toCreateActivityRequestBody,
  type CreateActivityFieldErrors,
  type CreateActivityInput,
} from "@/lib/activities";
import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type FormState = {
  title: string;
  category: string;
  description: string;
  startTime: string;
  location: string;
  capacity: string;
};

const initialFormState: FormState = {
  title: "",
  category: activityCategoryOptions[0]?.value ?? "",
  description: "",
  startTime: "",
  location: "",
  capacity: "2",
};

export function CreateActivityForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<CreateActivityFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue(field: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const parsed = createActivitySchema.safeParse(values as CreateActivityInput);

    if (!parsed.success) {
      setFieldErrors(getCreateActivityFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toCreateActivityRequestBody(parsed.data)),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: string;
            fieldErrors?: CreateActivityFieldErrors;
            activity?: { id: string };
          }
        | null;

      if (!response.ok) {
        if (result?.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }

        setServerError(
          result?.error ?? "We couldn't create the activity. Please try again.",
        );
        return;
      }

      const activityId = result?.activity?.id;

      if (!activityId) {
        setServerError("The activity was created, but the response was incomplete.");
        return;
      }

      router.push(`/activities/${activityId}`);
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Title"
          name="title"
          value={values.title}
          error={fieldErrors.title}
          onChange={(value) => updateValue("title", value)}
          placeholder="Pickup basketball at Marino"
        />

        <SelectField
          label="Category"
          name="category"
          value={values.category}
          error={fieldErrors.category}
          onChange={(value) => updateValue("category", value)}
          options={activityCategoryOptions}
        />

        <TextAreaField
          className="md:col-span-2"
          label="Description"
          name="description"
          value={values.description}
          error={fieldErrors.description}
          onChange={(value) => updateValue("description", value)}
          placeholder="Share any details other students should know."
          rows={5}
        />

        <Field
          label="Start time"
          name="startTime"
          type="datetime-local"
          value={values.startTime}
          error={fieldErrors.startTime}
          onChange={(value) => updateValue("startTime", value)}
        />

        <Field
          label="Location"
          name="location"
          value={values.location}
          error={fieldErrors.location}
          onChange={(value) => updateValue("location", value)}
          placeholder="Marino Center court 2"
        />

        <Field
          label="Capacity"
          name="capacity"
          type="number"
          value={values.capacity}
          error={fieldErrors.capacity}
          onChange={(value) => updateValue("capacity", value)}
          min="2"
          max="20"
          step="1"
        />
      </div>

      {serverError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          The host is automatically counted as the first member.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Creating..." : "Create activity"}
        </button>
      </div>
    </form>
  );
}

type BaseFieldProps = {
  label: string;
  name: keyof FormState;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function Field({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  className,
  type = "text",
  ...rest
}: BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-zinc-900 ${className ?? ""}`}>
      <span>{label}</span>
      <input
        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none ring-0 transition focus:border-zinc-950"
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${name}-error`} className="text-sm font-normal text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  className,
  rows = 4,
}: BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "value" | "onChange">) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-zinc-900 ${className ?? ""}`}>
      <span>{label}</span>
      <textarea
        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none ring-0 transition focus:border-zinc-950"
        name={name}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error ? (
        <span id={`${name}-error`} className="text-sm font-normal text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  error,
  onChange,
  options,
}: BaseFieldProps & {
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-zinc-900">
      <span>{label}</span>
      <select
        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none ring-0 transition focus:border-zinc-950"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={`${name}-error`} className="text-sm font-normal text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
