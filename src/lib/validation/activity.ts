import { Category } from "@/generated/prisma/enums";
import { z } from "zod";

const categoryValues = Object.values(Category) as [Category, ...Category[]];

export const createActivitySchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(80, "Keep the title under 80 characters."),
  category: z.enum(categoryValues),
  description: z.string().trim().max(500, "Keep the description under 500 characters."),
  startTime: z.string().trim().min(1, "Pick a time in the future.").pipe(z.iso.datetime({ offset: true })).refine(
    (value) => new Date(value).getTime() > Date.now(),
    {
      message: "Pick a time in the future.",
    },
  ),
  location: z
    .string()
    .trim()
    .min(1, "Add where you'll meet.")
    .max(120, "Keep the location under 120 characters."),
  capacity: z
    .number()
    .int()
    .min(2, "Choose a capacity between 2 and 20.")
    .max(20, "Choose a capacity between 2 and 20."),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
