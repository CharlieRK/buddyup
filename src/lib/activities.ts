import { Category } from "@/generated/prisma/enums";
import { z } from "zod";

export const activityCategories = [
  Category.SPORTS,
  Category.STUDY,
  Category.FOOD,
  Category.ARTS_CULTURE,
  Category.OUTDOORS,
  Category.GAMING,
  Category.OTHER,
] as const;

const categoryLabels: Record<(typeof activityCategories)[number], string> = {
  [Category.SPORTS]: "Sports",
  [Category.STUDY]: "Study",
  [Category.FOOD]: "Food",
  [Category.ARTS_CULTURE]: "Arts & Culture",
  [Category.OUTDOORS]: "Outdoors",
  [Category.GAMING]: "Gaming",
  [Category.OTHER]: "Other",
};

const createActivityStartTimeSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((value) => !Number.isNaN(value.getTime()), {
    message: "Start time is invalid.",
  })
  .refine((value) => value.getTime() > Date.now(), {
    message: "Start time must be in the future.",
  });

export const createActivitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  category: z.enum(activityCategories, {
    error: "Please choose a category.",
  }),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .default(""),
  startTime: createActivityStartTimeSchema,
  location: z
    .string()
    .trim()
    .min(1, "Location is required.")
    .max(160, "Location must be 160 characters or fewer."),
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number.")
    .min(2, "Capacity must be between 2 and 20.")
    .max(20, "Capacity must be between 2 and 20."),
});

export type CreateActivityInput = z.input<typeof createActivitySchema>;
export type CreateActivityValues = z.output<typeof createActivitySchema>;

export type CreateActivityFieldErrors = Partial<
  Record<keyof CreateActivityInput, string>
>;

export const activityCategoryOptions = activityCategories.map((value) => ({
  value,
  label: categoryLabels[value],
}));

export function formatActivityCategory(category: (typeof activityCategories)[number]) {
  return categoryLabels[category];
}

export function getCreateActivityFieldErrors(
  error: z.ZodError<CreateActivityInput>,
): CreateActivityFieldErrors {
  const { fieldErrors } = error.flatten();

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([key, messages]) => [key, messages?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  ) as CreateActivityFieldErrors;
}

export function toCreateActivityRequestBody(values: CreateActivityValues) {
  return {
    ...values,
    startTime: values.startTime.toISOString(),
  };
}

export function toDateTimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return offsetDate.toISOString().slice(0, 16);
}
