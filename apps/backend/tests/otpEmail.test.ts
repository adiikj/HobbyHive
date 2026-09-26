import { describe, it, expect } from "vitest";
import { otpEmail } from "../src/emails/otpEmail.js";

describe("otpEmail", () => {
  it("puts the code in the subject, the HTML and the plain-text version", () => {
    const email = otpEmail({ otp: "482913", name: "Priya Sharma", minutes: 10 });
    expect(email.subject).toBe("482913 is your HobbyHive code");
    expect(email.html).toContain(">482913<"); // one unbroken run, so copying gives the code as-is
    expect(email.html).toContain("Hi Priya,");
    expect(email.html).toContain("10 minutes");
    expect(email.text).toContain("    482913");
    expect(email.text).toMatch(/^Hi Priya,/);
  });

  it("escapes the name, so a sign-up form can't inject HTML into the email", () => {
    const { html } = otpEmail({ otp: "111111", name: "<script>x</script> Evil" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("Hi &lt;script&gt;x&lt;/script&gt;,");
  });

  it("falls back to a friendly greeting without a name", () => {
    expect(otpEmail({ otp: "123456" }).html).toContain("Hi there,");
  });
});
