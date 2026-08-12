import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignIn from "@/components/auth/SignIn";
import { renderWithStore } from "./testUtils";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const loginUserMock = vi.fn();
vi.mock("@/api/api", () => ({
  loginUser: (...args: unknown[]) => loginUserMock(...args),
}));

beforeEach(() => {
  pushMock.mockClear();
  loginUserMock.mockReset();
  localStorage.clear();
});

describe("SignIn", () => {
  it("shows an error and does not navigate when login fails", async () => {
    loginUserMock.mockRejectedValueOnce(new Error("Invalid credentials"));
    const user = userEvent.setup();

    renderWithStore(<SignIn />);

    await user.type(screen.getByPlaceholderText("Enter email or username"), "aditya");
    await user.type(screen.getByPlaceholderText("Enter password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("stores the token and redirects to /dashboard on success", async () => {
    loginUserMock.mockResolvedValueOnce({ data: { accessToken: "token-123" } });
    const user = userEvent.setup();

    renderWithStore(<SignIn />);

    await user.type(screen.getByPlaceholderText("Enter email or username"), "aditya");
    await user.type(screen.getByPlaceholderText("Enter password"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(localStorage.getItem("authToken")).toBe("token-123");
  });
});
