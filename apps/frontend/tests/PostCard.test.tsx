import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostCard from "@/components/dashboard/PostCard";
import type { Post } from "@/api/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const likePostMock = vi.fn();
const unlikePostMock = vi.fn();
const getCommentsMock = vi.fn();
const addCommentMock = vi.fn();
vi.mock("@/api/api", () => ({
  likePost: (...args: unknown[]) => likePostMock(...args),
  unlikePost: (...args: unknown[]) => unlikePostMock(...args),
  getComments: (...args: unknown[]) => getCommentsMock(...args),
  addComment: (...args: unknown[]) => addCommentMock(...args),
}));

const post: Post = {
  id: "post_1",
  content: "hello hobby world",
  imageUrl: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  hobby: { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" },
  author: { id: "user_2", name: "Alex", username: "alex", avatarUrl: null },
  likesCount: 5,
  commentsCount: 2,
  isLiked: false,
};

beforeEach(() => {
  likePostMock.mockReset();
  unlikePostMock.mockReset();
  getCommentsMock.mockReset();
  addCommentMock.mockReset();
});

describe("PostCard — like toggle", () => {
  it("optimistically updates the count before the request resolves, then reconciles", async () => {
    let resolveLike!: (v: { isLiked: boolean; likesCount: number }) => void;
    likePostMock.mockImplementationOnce(() => new Promise((resolve) => (resolveLike = resolve)));

    render(<PostCard post={post} />);

    const likeButton = screen.getByText("5").closest("button")!;
    fireEvent.click(likeButton);

    // the optimistic update is synchronous — happens before the request settles
    expect(screen.getByText("6")).toBeInTheDocument();

    resolveLike({ isLiked: true, likesCount: 6 });
    await waitFor(() => expect(likePostMock).toHaveBeenCalledWith("post_1"));
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("reverts the optimistic update if the request fails", async () => {
    let rejectLike!: (err: Error) => void;
    likePostMock.mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectLike = reject)));

    render(<PostCard post={post} />);

    const likeButton = screen.getByText("5").closest("button")!;
    fireEvent.click(likeButton);
    expect(screen.getByText("6")).toBeInTheDocument();

    rejectLike(new Error("network error"));
    await waitFor(() => expect(screen.getByText("5")).toBeInTheDocument());
  });
});

describe("PostCard — comments", () => {
  it("loads and displays comments when the comment button is clicked", async () => {
    getCommentsMock.mockResolvedValueOnce([
      {
        id: "c1",
        content: "Nice!",
        createdAt: new Date().toISOString(),
        author: { id: "user_3", name: "Sam", username: "sam", avatarUrl: null },
      },
    ]);
    const user = userEvent.setup();

    render(<PostCard post={post} />);

    await user.click(screen.getByText("2").closest("button")!);

    expect(await screen.findByText("Nice!")).toBeInTheDocument();
    expect(getCommentsMock).toHaveBeenCalledWith("post_1");
  });
});
