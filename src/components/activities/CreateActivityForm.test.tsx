import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateActivityForm } from "./CreateActivityForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("CreateActivityForm", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("shows inline validation errors when the form is submitted with invalid values (US-04 AC3)", async () => {
    const user = userEvent.setup();

    render(
      <CreateActivityForm
        currentUser={{
          id: "user-1",
          name: "Demo Student",
          email: "demo@northeastern.edu",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Post activity" }));

    expect(await screen.findByText("Add a title.")).toBeInTheDocument();
    expect(screen.getByText("Pick a time in the future.")).toBeInTheDocument();
    expect(screen.getByText("Add where you'll meet.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts valid activity data and redirects to the new detail page (US-04 AC4)", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "activity-123",
        },
      }),
    } as Response);

    render(
      <CreateActivityForm
        currentUser={{
          id: "user-1",
          name: "Demo Student",
          email: "demo@northeastern.edu",
        }}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "Algorithms study group");
    await user.click(screen.getByRole("button", { name: "Study" }));
    await user.type(screen.getByLabelText("Start time"), "2026-11-01T18:30");
    await user.type(screen.getByLabelText("Location"), "Snell Library");
    await user.type(
      screen.getByLabelText("Description"),
      "Bring old exams and practice problems.",
    );

    await user.click(screen.getByRole("button", { name: "Post activity" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = vi.mocked(global.fetch).mock.calls[0] ?? [];
    expect(url).toBe("/api/v1/activities");
    expect(options).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const body = JSON.parse(String(options?.body));
    expect(body).toMatchObject({
      title: "Algorithms study group",
      category: "STUDY",
      location: "Snell Library",
      capacity: 4,
    });
    expect(body.startTime).toMatch(/Z$/);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/activities/activity-123");
    });
  });
});
