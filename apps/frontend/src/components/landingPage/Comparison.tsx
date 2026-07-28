import Image from "next/image";

const GENERIC_POSTS = [
  { tag: "Fitness", accent: "bg-orange-400", avatar: "/images/5.png", caption: "Chest day PR, legs still shaking" },
  { tag: "Politics", accent: "bg-slate-400", avatar: "/images/2.png", caption: "Unpopular opinion on the debate" },
  { tag: "Ad", accent: "bg-gray-300", avatar: "/images/1.png", caption: "Sponsored: shop the summer sale" },
];

const HOBBYHIVE_POSTS = [
  { tag: "Dance", accent: "bg-pink-500", avatar: "/images/3.png", caption: "8-count practice, finally clean" },
  { tag: "Dance", accent: "bg-pink-500", avatar: "/images/4.png", caption: "New choreo drop for Friday" },
  { tag: "Dance", accent: "bg-pink-500", avatar: "/images/1.png", caption: "Recital run-through, one more time" },
];

interface Post {
  tag: string;
  accent: string;
  avatar: string;
  caption: string;
}

function MiniFeed({ label, labelColor, posts }: { label: string; labelColor: string; posts: Post[] }) {
  return (
    <div className="rounded-[1.5rem] border-8 border-white bg-white shadow-lg overflow-hidden">
      <div className="bg-chblack/5 px-4 py-3">
        <p className={`font-quick font-semibold text-xs ${labelColor}`}>{label}</p>
      </div>
      <div className="bg-beige p-3 space-y-2">
        {posts.map((post, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-white rounded-lg shadow-sm p-2.5">
            <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
              <Image src={post.avatar} alt="" fill sizes="28px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <span className={`inline-block text-[10px] font-quick font-semibold text-white px-2 py-0.5 rounded-full ${post.accent}`}>
                {post.tag}
              </span>
              <p className="font-pop text-[11px] text-chblack/50 truncate">{post.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comparison() {
  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl mb-3">Same phone, different feed</h2>
        <p className="font-pop text-chblack/70 max-w-lg mx-auto mb-10 sm:mb-14">
          Here&apos;s what actually shows up on screen: not a marketing claim, the real difference.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-xl mx-auto">
          <div>
            <MiniFeed label="A TYPICAL FEED" labelColor="text-chblack/50" posts={GENERIC_POSTS} />
            <p className="font-pop text-sm text-chblack/60 mt-3">Mixed, algorithm-picked, one of everything.</p>
          </div>
          <div>
            <MiniFeed label="YOUR HOBBYHIVE FEED" labelColor="text-pink-600" posts={HOBBYHIVE_POSTS} />
            <p className="font-pop text-sm text-chblack/60 mt-3">Just dance. Because that&apos;s what you picked.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Comparison;
