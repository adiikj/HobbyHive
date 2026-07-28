import type { Metadata } from "next";
import MainLayout from "@/components/layout/HeaderFooterLayout";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Community Guidelines | HobbyHive",
  description: "What's expected of you in HobbyHive's hobby communities.",
};

export default function CommunityGuidelinesPage() {
  return (
    <MainLayout>
      <LegalPage title="Community Guidelines" updated="July 29, 2026">
        <section>
          <h2>1. Why these exist</h2>
          <p>
            HobbyHive works because every hobby room stays about that hobby. These guidelines exist to keep it that
            way, so a dance room stays useful for dancers and a gaming room stays useful for gamers.
          </p>
        </section>

        <section>
          <h2>2. Stay on-topic</h2>
          <p>
            Post in the hobby room that actually matches your content. Off-topic posts, unrelated links, and
            repeated cross-posting into rooms they don&apos;t belong in may be removed.
          </p>
        </section>

        <section>
          <h2>3. Be respectful</h2>
          <p>
            Disagree with a technique, a take, or a review if you want to, but keep it civil. Harassment, hate
            speech, personal attacks, and targeted bullying aren&apos;t allowed anywhere on HobbyHive.
          </p>
        </section>

        <section>
          <h2>4. Give credit</h2>
          <p>
            If you&apos;re posting someone else&apos;s work, art, choreography, or writing, credit them. Passing
            other people&apos;s work off as your own isn&apos;t allowed.
          </p>
        </section>

        <section>
          <h2>5. No spam or manipulation</h2>
          <p>
            Don&apos;t flood rooms with repetitive posts, fake engagement, or unsolicited self-promotion. Genuine
            posts about your own hobby progress are always welcome.
          </p>
        </section>

        <section>
          <h2>6. Keep it legal and safe</h2>
          <p>
            Don&apos;t post illegal content, content that endangers someone&apos;s safety, or anything that violates
            another person&apos;s rights.
          </p>
        </section>

        <section>
          <h2>7. Reporting content</h2>
          <p>
            If you see a post or comment that breaks these guidelines, use the report option on that post, or email
            us directly at <a href="mailto:contactus@hobbyhive.com">contactus@hobbyhive.com</a>. We review reports
            and take action where needed.
          </p>
        </section>

        <section>
          <h2>8. Enforcement</h2>
          <p>
            Depending on severity, we may remove content, issue a warning, or suspend an account. Serious or
            repeated violations can result in permanent removal from HobbyHive.
          </p>
        </section>
      </LegalPage>
    </MainLayout>
  );
}
