import Image from "next/image";

const MIXED = [
  { src: "/images/hobbies/dance.png", rotate: -8, top: "8%", left: "6%" },
  { src: "/images/hobbies/gaming.png", rotate: 6, top: "4%", left: "42%" },
  { src: "/images/hobbies/fitness.png", rotate: -4, top: "38%", left: "22%" },
  { src: "/images/hobbies/anime.png", rotate: 9, top: "12%", left: "68%" },
  { src: "/images/hobbies/art.png", rotate: -10, top: "48%", left: "58%" },
  { src: "/images/hobbies/singing.png", rotate: 5, top: "50%", left: "2%" },
];

const DANCE_FEED = ["/images/hobbies/dance.png", "/images/hobbies/dance-2.png", "/images/hobbies/dance-3.png"];

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
            video, and an ad — back to back. None of it is wrong exactly. It&apos;s just not what
            you opened the app for.
          </p>
          <p className="font-pop mt-4 text-base sm:text-lg text-chblack font-semibold">
            HobbyHive keeps it simple: pick your hobby, and that&apos;s the whole feed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white shadow-md p-4 flex flex-col">
            <p className="font-quick text-xs font-semibold text-chblack/40 mb-3">EVERYONE ELSE</p>
            <div className="relative flex-1 min-h-[220px]">
              {MIXED.map((item, i) => (
                <div
                  key={i}
                  className="absolute rounded-lg overflow-hidden border-2 border-white shadow-md w-20 h-20 sm:w-24 sm:h-24"
                  style={{
                    top: item.top,
                    left: item.left,
                    transform: `rotate(${item.rotate}deg)`,
                  }}
                >
                  <Image src={item.src} alt="" fill sizes="96px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-md p-4 border-2 border-pink-200 flex flex-col">
            <p className="font-quick text-xs font-semibold text-pink-600 mb-3">HOBBYHIVE</p>
            <div className="flex-1 flex flex-col justify-center gap-3">
              {DANCE_FEED.map((src, i) => (
                <div key={i} className="flex items-center gap-3 bg-beige rounded-lg p-2.5">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <span className="font-quick text-sm font-medium text-chblack/70">Dance</span>
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
