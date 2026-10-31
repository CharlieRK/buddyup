import { created, errorResponse, validationErrorResponse } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/session";
import { createActivity, serializeActivity } from "@/lib/services/activities";
import { createActivitySchema } from "@/lib/validation/activity";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }

  const parsed = createActivitySchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const currentUser = await requireUser();
  const result = await createActivity(currentUser.id, parsed.data);

  return created(serializeActivity(result));
}
