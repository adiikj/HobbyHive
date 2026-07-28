import type { Metadata } from "next";
import MainLayout from "@/components/layout/HeaderFooterLayout";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | HobbyHive",
  description: "How HobbyHive collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <LegalPage title="Privacy Policy" updated="July 29, 2026">
        <section>
          <h2>1. Overview</h2>
          <p>
            This policy explains what information HobbyHive collects when you use the app, why we collect it, and
            what choices you have. HobbyHive is a hobby-scoped feed: you pick the hobbies you care about, and your
            feed only ever shows content for those. That design shapes what data we actually need from you, and we
            try to keep it to that.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <p>We collect information in three ways:</p>
          <ul>
            <li>
              <strong>Account information.</strong> Your name, username, email address, and password (stored as a
              secure hash, never in plain text) when you sign up.
            </li>
            <li>
              <strong>Hobby and profile data.</strong> The hobbies you select, and any profile details you choose to
              add later, such as a bio or avatar.
            </li>
            <li>
              <strong>Content and activity.</strong> Posts, comments, likes, and messages you post in hobby rooms,
              along with basic usage data like which hobby tabs you visit and how you interact with your feed.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How we use your information</h2>
          <p>We use the information above to:</p>
          <ul>
            <li>Create and secure your account, and verify it&apos;s really you signing in.</li>
            <li>Build and scope your feed to the hobbies you&apos;ve picked.</li>
            <li>Show your posts, comments, and activity to other members of the same hobby communities.</li>
            <li>Fix bugs, improve performance, and understand how HobbyHive is actually used.</li>
            <li>Send you account-related emails, like verification codes and important service updates.</li>
          </ul>
          <p className="mt-3">
            We don&apos;t use your data to build a cross-hobby recommendation engine or to serve you content outside
            the hobbies you&apos;ve chosen. That&apos;s the whole point of HobbyHive.
          </p>
        </section>

        <section>
          <h2>4. Sharing your information</h2>
          <p>
            We do not sell your personal information. We share it only in limited cases: with service providers who
            help us run HobbyHive (such as hosting and email delivery), when required by law, or if you choose to
            make your content public within a hobby room where other members can see it.
          </p>
        </section>

        <section>
          <h2>5. Cookies and similar technologies</h2>
          <p>
            HobbyHive uses cookies to keep you signed in and to remember basic preferences, like your selected
            hobbies. We don&apos;t use third-party advertising trackers.
          </p>
        </section>

        <section>
          <h2>6. Data retention</h2>
          <p>
            We keep your account and content for as long as your account is active. If you delete your account, we
            remove your personal information and posted content within a reasonable period, except where we&apos;re
            required to retain it for legal or security reasons.
          </p>
        </section>

        <section>
          <h2>7. Your rights and choices</h2>
          <p>You can, at any time:</p>
          <ul>
            <li>Add or remove hobbies from your profile, which immediately changes your feed.</li>
            <li>Edit or delete any post or comment you&apos;ve made.</li>
            <li>Request a copy of your data or ask us to delete your account entirely.</li>
          </ul>
          <p className="mt-3">
            To make a data request, contact us at{" "}
            <a href="mailto:contactus@hobbyhive.com">contactus@hobbyhive.com</a>.
          </p>
        </section>

        <section>
          <h2>8. Children&apos;s privacy</h2>
          <p>
            HobbyHive is not directed at children under 13, and we do not knowingly collect information from anyone
            under that age. If we learn that we&apos;ve collected information from a child under 13, we&apos;ll
            delete it.
          </p>
        </section>

        <section>
          <h2>9. Security</h2>
          <p>
            We use standard safeguards, including password hashing and encrypted connections, to protect your
            information. No system is perfectly secure, so we encourage you to use a strong, unique password.
          </p>
        </section>

        <section>
          <h2>10. Changes to this policy</h2>
          <p>
            If we make material changes to this policy, we&apos;ll update the date at the top of this page and, for
            significant changes, notify you directly.
          </p>
        </section>

        <section>
          <h2>11. Contact us</h2>
          <p>
            Questions about this policy or your data? Email us at{" "}
            <a href="mailto:contactus@hobbyhive.com">contactus@hobbyhive.com</a>.
          </p>
        </section>
      </LegalPage>
    </MainLayout>
  );
}
