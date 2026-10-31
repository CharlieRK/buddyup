import { NextResponse } from "next/server";
import { z } from "zod";

type ErrorFields = Record<string, string[] | undefined>;

export function ok<T>(data: T) {
  return NextResponse.json({ data });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: ErrorFields,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}

export function validationErrorResponse(error: z.ZodError) {
  return errorResponse(
    400,
    "VALIDATION_ERROR",
    "Please fix the highlighted fields.",
    z.flattenError(error).fieldErrors,
  );
}
