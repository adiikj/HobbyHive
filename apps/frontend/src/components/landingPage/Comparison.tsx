const GENERIC_POSTS = [
  { tag: "Fitness", accent: "bg-orange-400" },
  { tag: "Politics", accent: "bg-slate-400" },
  { tag: "Ad", accent: "bg-gray-300" },
];

const HOBBYHIVE_POSTS = [
  { tag: "Dance", accent: "bg-pink-500" },
  { tag: "Dance", accent: "bg-pink-500" },
  { tag: "Dance", accent: "bg-pink-500" },
];

function MiniFeed({
  label,
  labelColor,
  posts,
}: {
  label: string;
  labelColor: string;
  posts: { tag: string; accent: string }[];
}) {
  return (
    <div className="rounded-[1.5rem] border-8 border-white bg-white shadow-lg overflow-hidden">
      <div className="bg-chblack/5 px-4 py-3">
        <p className={`font-quick font-semibold text-xs ${labelColor}`}>{label}</p>
      </div>
      <div className="bg-beige p-3 space-y-2">
        {posts.map((post, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-white rounded-lg shadow-sm p-2.5">
            <div className="w-7 h-7 rounded-full bg-chblack/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <span className={`inline-block text-[10px] font-quick font-semibold text-white px-2 py-0.5 rounded-full ${post.accent}`}>
                {post.tag}
              </span>
              <div className="h-1.5 bg-chblack/10 rounded-full w-4/5" />
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
          Here&apos;s what actually shows up on screen — not a marketing claim, the real difference.
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
