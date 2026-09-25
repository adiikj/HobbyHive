import Link from "next/link";

const MENTION = /(^|[^\w@])@([a-zA-Z0-9_.]{2,30})/g;

/** Renders text with @username mentions as profile links (mirrors the backend's mention parsing). */
function MentionText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(MENTION)) {
    const username = match[2].replace(/\.+$/, "");
    const start = match.index! + match[1].length;
    parts.push(text.slice(last, start));
    parts.push(
      <Link key={start} href={`/profile/${username}`} className="font-semibold text-brand hover:underline">
        @{username}
      </Link>
    );
    last = start + 1 + username.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

export default MentionText;
