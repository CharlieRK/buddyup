import { Category } from "@/generated/prisma/enums";

export type CategoryOption = {
  value: Category;
  label: string;
  color: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: Category.SPORTS, label: "Sports", color: "#2F5BEA" },
  { value: Category.STUDY, label: "Study", color: "#7A4FD6" },
  { value: Category.FOOD, label: "Food", color: "#E07A1F" },
  { value: Category.ARTS_CULTURE, label: "Arts & Culture", color: "#C2367A" },
  { value: Category.OUTDOORS, label: "Outdoors", color: "#178A5C" },
  { value: Category.GAMING, label: "Gaming", color: "#0E8FA3" },
  { value: Category.OTHER, label: "Other", color: "#6B7591" },
];

export const DEFAULT_CATEGORY = Category.SPORTS;

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Category, string>;

export const CATEGORY_COLORS = Object.fromEntries(
  CATEGORY_OPTIONS.map((option) => [option.value, option.color]),
) as Record<Category, string>;
