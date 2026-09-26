import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogPracticeSheet from "@/components/practice/LogPracticeSheet";

const logPracticeMock = vi.fn();
const sharePracticeMock = vi.fn();
vi.mock("@/api/api", () => ({
  getMyHobbies: () => Promise.resolve([{ id: "hobby_dance", name: "Dance", slug: "dance", icon: null }]),
  getMyPractice: () => Promise.resolve({ sessions: [], recentFocus: ["turns"] }),
  getHobbySkills: () =>
    Promise.resolve({
      skills: [
        { id: "sk_spot", name: "Spotting", my: { status: "LEARNING" } },
        { id: "sk_double", name: "Double pirouette", my: null },
      ],
    }),
  logPractice: (...args: unknown[]) => logPracticeMock(...args),
  sharePractice: (...args: unknown[]) => sharePracticeMock(...args),
  uploadPostImage: vi.fn(),
}));

const dance = { id: "hobby_dance", name: "Dance", slug: "dance" };

beforeEach(() => {
  logPracticeMock.mockReset().mockResolvedValue({ id: "ps_1", postId: null });
  sharePracticeMock.mockReset().mockResolvedValue({ id: "post_1" });
});

describe("LogPracticeSheet", () => {
  it("saves a session without posting anything by default", async () => {
    const onLogged = vi.fn();
    const user = userEvent.setup();
    render(<LogPracticeSheet open onClose={vi.fn()} hobby={dance} minutes={25} onLogged={onLogged} />);

    await user.click(await screen.findByRole("button", { name: "turns" })); // recent focus quick pick
    await user.click(screen.getByRole("button", { name: /Great/ }));
    await user.type(screen.getByLabelText(/Note to self/), "spotting clicked");
    await user.click(screen.getByRole("button", { name: "Save session" }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(logPracticeMock).toHaveBeenCalledWith(
      expect.objectContaining({ hobbyId: "hobby_dance", durationMin: 25, focus: "turns", feel: "great", note: "spotting clicked" })
    );
    expect(sharePracticeMock).not.toHaveBeenCalled();
  });

  it("shares to the hive when asked, without the private note", async () => {
    const user = userEvent.setup();
    render(<LogPracticeSheet open onClose={vi.fn()} hobby={dance} minutes={40} />);

    await user.type(await screen.findByLabelText("What did you work on?"), "isolations");
    await user.type(screen.getByLabelText(/Note to self/), "hips still stiff");
    await user.click(screen.getByRole("checkbox"));
    await user.type(screen.getByPlaceholderText("Say something about it (optional)"), "40 minutes of isolations");
    await user.click(screen.getByRole("button", { name: "Save & share" }));

    await waitFor(() => expect(sharePracticeMock).toHaveBeenCalledWith("ps_1", { caption: "40 minutes of isolations", images: [] }));
  });

  it("asks what you worked on before saving", async () => {
    const user = userEvent.setup();
    render(<LogPracticeSheet open onClose={vi.fn()} hobby={dance} minutes={10} />);

    await screen.findByRole("button", { name: "turns" });
    await user.click(screen.getByRole("button", { name: "Save session" }));

    expect(await screen.findByText("Say what you worked on")).toBeInTheDocument();
    expect(logPracticeMock).not.toHaveBeenCalled();
  });

  it("tags the session with a skill you're learning", async () => {
    const user = userEvent.setup();
    render(<LogPracticeSheet open onClose={vi.fn()} hobby={dance} minutes={30} />);

    await user.click(await screen.findByRole("button", { name: "Spotting" }));
    // Picking a skill with an empty "worked on" fills it in
    expect(screen.getByLabelText("What did you work on?")).toHaveValue("Spotting");
    await user.click(screen.getByRole("button", { name: "Save session" }));

    await waitFor(() => expect(logPracticeMock).toHaveBeenCalledWith(expect.objectContaining({ skillId: "sk_spot", focus: "Spotting" })));
  });
});
