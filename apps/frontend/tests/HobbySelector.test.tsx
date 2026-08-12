import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HobbySelector from "@/components/hobbies/HobbySelector";

const getHobbiesMock = vi.fn();
const setMyHobbiesMock = vi.fn();
vi.mock("@/api/api", () => ({
  getHobbies: (...args: unknown[]) => getHobbiesMock(...args),
  setMyHobbies: (...args: unknown[]) => setMyHobbiesMock(...args),
}));

const hobbies = [
  { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" },
  { id: "hobby_anime", name: "Anime", slug: "anime", icon: "🎌" },
];

beforeEach(() => {
  getHobbiesMock.mockReset().mockResolvedValue(hobbies);
  setMyHobbiesMock.mockReset();
});

describe("HobbySelector", () => {
  it("refuses to save with nothing selected — the curation mechanic needs at least one hobby", async () => {
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(<HobbySelector title="Pick" submitLabel="Continue" onSaved={onSaved} />);

    await screen.findByText("Dance");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Pick at least one hobby to continue.")).toBeInTheDocument();
    expect(setMyHobbiesMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("saves the selected hobby ids and calls onSaved with the result", async () => {
    setMyHobbiesMock.mockResolvedValueOnce([hobbies[0]]);
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(<HobbySelector title="Pick" submitLabel="Continue" onSaved={onSaved} />);

    await user.click(await screen.findByText("Dance"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(setMyHobbiesMock).toHaveBeenCalledWith(["hobby_dance"]);
    expect(onSaved).toHaveBeenCalledWith([hobbies[0]]);
  });
});
