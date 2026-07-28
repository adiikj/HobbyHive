import Image from "next/image";

const MIXED = [
  { src: "/images/hobbies/fitness.png", rotate: -4, top: "34%", left: "14%", tag: "Workout", color: "#f97316" },
  { src: "/images/hobbies/singing.png", rotate: 5, top: "44%", left: "2%", tag: "Hot Take", color: "#64748b" },
  { src: "/images/hobbies/dance.png", rotate: -8, top: "6%", left: "4%", tag: "Dance", color: "#0ea5e9" },
  { src: "/images/hobbies/art.png", rotate: -10, top: "40%", left: "34%", tag: "Ad", color: "#a1a1aa" },
  { src: "/images/hobbies/gaming.png", rotate: 6, top: "2%", left: "34%", tag: "Gaming", color: "#8b5cf6" },
  { src: "/images/hobbies/anime.png", rotate: 9, top: "8%", left: "46%", tag: "Random", color: "#eab308" },
];

const DANCE_FEED = [
  { src: "/images/hobbies/dance.png", caption: "Studio session" },
  { src: "/images/hobbies/dance-2.png", caption: "New routine" },
  { src: "/images/hobbies/dance-3.png", caption: "Recital clip" },
];

function About() {
  return (
    <section className="w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <h2 className="font-bnt text-chblack text-3xl sm:text-4xl leading-[1.05]">
            Every other app mixes everything together.
          </h2>
          <p className="font-pop mt-5 text-base sm:text-lg text-chblack/70">
            Scroll any feed and you&apos;ll get a workout clip, a stranger&apos;s hot take, a dance
            video, and an ad, back to back. None of it is wrong exactly. It&apos;s just not what
            you opened the app for.
          </p>
          <p className="font-pop mt-4 text-base sm:text-lg text-chblack font-semibold">
            HobbyHive keeps it simple: pick your hobby, and that&apos;s the whole feed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-xl bg-white shadow-md p-6 flex flex-col">
            <p className="font-quick text-xs font-semibold text-chblack/40 mb-3">EVERYONE ELSE</p>
            <div className="relative min-h-[280px] overflow-hidden">
              {MIXED.map((item, i) => (
                <div
                  key={i}
                  className="absolute rounded-lg overflow-hidden border-2 border-white shadow-md w-16 h-16 sm:w-20 sm:h-20"
                  style={{
                    top: item.top,
                    left: item.left,
                    transform: `rotate(${item.rotate}deg)`,
                  }}
                >
                  <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
                  <span
                    className="absolute bottom-1 left-1 text-[8px] font-quick font-semibold text-white px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-md p-6 border-2 border-pink-200 flex flex-col">
            <p className="font-quick text-xs font-semibold text-pink-600 mb-3">HOBBYHIVE</p>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {DANCE_FEED.map((post, i) => (
                <div key={i} className="flex items-center gap-3 bg-beige rounded-lg p-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={post.src} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-quick font-semibold text-white px-2 py-0.5 rounded-full bg-pink-600">
                      Dance
                    </span>
                    <p className="font-quick text-sm font-medium text-chblack/70 mt-1">{post.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
