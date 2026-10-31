import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateActivityForm } from "./create-activity-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("CreateActivityForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("shows an inline error for a past start time and skips the request", async () => {
    const user = userEvent.setup();

    render(<CreateActivityForm />);

    await user.type(screen.getByLabelText("Title"), "Campus walk");
    await user.type(screen.getByLabelText("Start time"), "2020-01-01T10:00");
    await user.type(screen.getByLabelText("Location"), "Centennial Common");
    await user.clear(screen.getByLabelText("Capacity"));
    await user.type(screen.getByLabelText("Capacity"), "4");

    await user.click(screen.getByRole("button", { name: "Create activity" }));

    expect(await screen.findByText("Start time must be in the future.")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the form and redirects to the activity detail page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ activity: { id: "activity_123" } }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    render(<CreateActivityForm />);

    await user.type(screen.getByLabelText("Title"), "Dinner after class");
    await user.selectOptions(screen.getByLabelText("Category"), "FOOD");
    await user.type(
      screen.getByLabelText("Description"),
      "Trying the new place near campus.",
    );
    await user.type(screen.getByLabelText("Start time"), "2099-05-20T18:30");
    await user.type(screen.getByLabelText("Location"), "Huntington Ave");
    await user.clear(screen.getByLabelText("Capacity"));
    await user.type(screen.getByLabelText("Capacity"), "5");

    await user.click(screen.getByRole("button", { name: "Create activity" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/activities",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/activities/activity_123");
    expect(refreshMock).toHaveBeenCalled();
  });
});
