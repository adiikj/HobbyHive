import type { Metadata } from "next";
import MainLayout from "@/components/layout/HeaderFooterLayout";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | HobbyHive",
  description: "The terms that govern your use of HobbyHive.",
};

export default function TermsPage() {
  return (
    <MainLayout>
      <LegalPage title="Terms & Conditions" updated="July 29, 2026">
        <section>
          <h2>1. Acceptance of terms</h2>
          <p>
            By creating an account or using HobbyHive, you agree to these terms. If you don&apos;t agree, please
            don&apos;t use the app.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use HobbyHive. By signing up, you confirm that you meet this
            requirement and that the information you provide is accurate.
          </p>
        </section>

        <section>
          <h2>3. Your account</h2>
          <p>
            You&apos;re responsible for keeping your password secure and for all activity that happens under your
            account. Let us know right away if you think someone else has accessed it.
          </p>
        </section>

        <section>
          <h2>4. Your hobby feed</h2>
          <p>
            When you sign up, you choose one or more hobbies. Your feed only shows content from those hobbies, not a
            mixed or algorithm-recommended timeline. You can add or drop hobbies at any time from settings, and your
            feed updates immediately.
          </p>
        </section>

        <section>
          <h2>5. Your content</h2>
          <p>
            You own the posts, comments, and other content you create on HobbyHive. By posting, you grant HobbyHive
            a license to display, distribute, and store that content within the app so other members of the same
            hobby communities can see it. You&apos;re responsible for making sure you have the right to post
            whatever you share.
          </p>
        </section>

        <section>
          <h2>6. Acceptable use</h2>
          <p>When using HobbyHive, you agree not to:</p>
          <ul>
            <li>Post content that&apos;s unrelated to the hobby room you&apos;re posting in, spam, or repetitive.</li>
            <li>Harass, threaten, or impersonate other members.</li>
            <li>Post illegal content, or content that infringes someone else&apos;s rights.</li>
            <li>Attempt to access another member&apos;s account or interfere with how HobbyHive operates.</li>
          </ul>
          <p className="mt-3">
            See our <a href="/community-guidelines">Community Guidelines</a> for more on what&apos;s expected in
            hobby rooms.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>
            You can delete your account at any time. We may suspend or terminate accounts that violate these terms,
            with notice where reasonably possible.
          </p>
        </section>

        <section>
          <h2>8. Intellectual property</h2>
          <p>
            The HobbyHive name, logo, and app design belong to HobbyHive. These terms don&apos;t grant you any
            rights to our branding or trademarks.
          </p>
        </section>

        <section>
          <h2>9. Disclaimers</h2>
          <p>
            HobbyHive is provided as is. We work to keep the app reliable, but we don&apos;t guarantee it will always
            be available, error-free, or uninterrupted.
          </p>
        </section>

        <section>
          <h2>10. Limitation of liability</h2>
          <p>
            To the extent permitted by law, HobbyHive isn&apos;t liable for indirect or consequential damages arising
            from your use of the app.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. If we make material changes, we&apos;ll update the date at
            the top of this page and, for significant changes, notify you directly.
          </p>
        </section>

        <section>
          <h2>12. Contact us</h2>
          <p>
            Questions about these terms? Email us at <a href="mailto:contactus@hobbyhive.com">contactus@hobbyhive.com</a>.
          </p>
        </section>
      </LegalPage>
    </MainLayout>
  );
}
