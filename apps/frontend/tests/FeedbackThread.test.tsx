import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeedbackThread from "@/components/posts/FeedbackThread";
import type { Post } from "@/api/api";

const getPostFeedbackMock = vi.fn();
const giveFeedbackMock = vi.fn();
const markHelpfulMock = vi.fn();
vi.mock("@/api/api", () => ({
  getPostFeedback: (...a: unknown[]) => getPostFeedbackMock(...a),
  giveFeedback: (...a: unknown[]) => giveFeedbackMock(...a),
  markFeedbackHelpful: (...a: unknown[]) => markHelpfulMock(...a),
  deleteFeedback: vi.fn(),
  setFeedbackAsk: vi.fn(),
}));

const post = {
  id: "post_1",
  content: "Turn practice",
  imageUrl: null,
  createdAt: new Date().toISOString(),
  hobby: { id: "h1", name: "Dance", slug: "dance", icon: null },
  author: { id: "u2", name: "Mira K", username: "mira", avatarUrl: null },
  likesCount: 0,
  commentsCount: 0,
  isLiked: false,
  feedbackAsk: "Is my spotting late?",
} as Post;

const item = {
  id: "fb_1",
  working: "Arms are relaxed",
  tryNext: "Spot a beat earlier",
  at: "0:12",
  helpfulAt: null,
  createdAt: new Date().toISOString(),
  author: { id: "u3", name: "Jonah", username: "jonah", avatarUrl: null },
  isOwn: false,
  mentorLevel: "Mentor",
};

beforeEach(() => {
  getPostFeedbackMock.mockReset();
  giveFeedbackMock.mockReset();
  markHelpfulMock.mockReset();
});

describe("FeedbackThread", () => {
  it("shows structured feedback with the giver's mentor level", async () => {
    getPostFeedbackMock.mockResolvedValue({ ask: post.feedbackAsk, canGive: false, canMarkHelpful: false, feedback: [item] });
    render(<FeedbackThread post={post} onAskChange={vi.fn()} />);

    expect(await screen.findByText("Arms are relaxed")).toBeInTheDocument();
    expect(screen.getByText("Spot a beat earlier")).toBeInTheDocument();
    expect(screen.getByText("0:12")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
  });

  it("lets the asker mark feedback helpful", async () => {
    getPostFeedbackMock.mockResolvedValue({ ask: post.feedbackAsk, canGive: false, canMarkHelpful: true, feedback: [item] });
    markHelpfulMock.mockResolvedValue({ id: "fb_1", helpfulAt: new Date().toISOString() });
    const user = userEvent.setup();
    render(<FeedbackThread post={post} onAskChange={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /This helped/ }));

    expect(markHelpfulMock).toHaveBeenCalledWith("fb_1", true);
    expect(await screen.findByRole("button", { name: /Marked helpful/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("needs both parts before feedback can be sent", async () => {
    getPostFeedbackMock.mockResolvedValue({ ask: post.feedbackAsk, canGive: true, canMarkHelpful: false, feedback: [] });
    giveFeedbackMock.mockResolvedValue({ ...item, isOwn: true, mentorLevel: null });
    const user = userEvent.setup();
    render(<FeedbackThread post={post} onAskChange={vi.fn()} />);

    const send = await screen.findByRole("button", { name: "Send feedback" });
    await user.type(screen.getByPlaceholderText("Start with what they're doing well"), "Arms are relaxed");
    expect(send).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Just one, so it's easy to act on"), "Spot a beat earlier");
    await user.click(send);

    await waitFor(() => expect(giveFeedbackMock).toHaveBeenCalledWith("post_1", { working: "Arms are relaxed", tryNext: "Spot a beat earlier", at: undefined }));
  });
});
