import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveButton from "@/components/dashboard/SaveButton";

const savePostMock = vi.fn();
const unsavePostMock = vi.fn();
const getCollectionsMock = vi.fn();
const createCollectionMock = vi.fn();
vi.mock("@/api/api", () => ({
  savePost: (...args: unknown[]) => savePostMock(...args),
  unsavePost: (...args: unknown[]) => unsavePostMock(...args),
  getCollections: (...args: unknown[]) => getCollectionsMock(...args),
  createCollection: (...args: unknown[]) => createCollectionMock(...args),
}));

beforeEach(() => {
  savePostMock.mockReset().mockResolvedValue({ isSaved: true, collectionId: null });
  unsavePostMock.mockReset().mockResolvedValue({ isSaved: false, collectionId: null });
  getCollectionsMock.mockReset().mockResolvedValue({
    totalSaved: 1,
    collections: [{ id: "col_1", name: "Tutorials", createdAt: "", count: 0, coverImageUrl: null }],
  });
  createCollectionMock.mockReset();
});

describe("SaveButton", () => {
  it("saves instantly, then offers collections to file the post into", async () => {
    const user = userEvent.setup();
    render(<SaveButton postId="post_1" initialSaved={false} />);

    await user.click(screen.getByRole("button", { name: "Save post" }));

    expect(savePostMock).toHaveBeenCalledWith("post_1");
    expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Tutorials" }));
    expect(savePostMock).toHaveBeenLastCalledWith("post_1", "col_1");
  });

  it("unsaves when already saved, and rolls back if that fails", async () => {
    unsavePostMock.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<SaveButton postId="post_1" initialSaved />);

    await user.click(screen.getByRole("button", { name: "Remove from saved" }));

    expect(unsavePostMock).toHaveBeenCalledWith("post_1");
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument());
  });
});
