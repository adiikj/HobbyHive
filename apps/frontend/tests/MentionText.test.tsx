import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MentionText from "@/components/posts/MentionText";

describe("MentionText", () => {
  it("links @mentions to profiles, leaving emails and punctuation alone", () => {
    const { container } = render(<MentionText text="nice one @priya_dances and @leo.sings. mail me@example.com" />);

    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/profile/priya_dances", "/profile/leo.sings"]);
    expect(container.textContent).toBe("nice one @priya_dances and @leo.sings. mail me@example.com");
  });
});
