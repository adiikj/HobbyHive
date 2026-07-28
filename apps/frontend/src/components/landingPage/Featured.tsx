import Link from "next/link";
import Image from "next/image";

const HOBBIES = [
  { slug: "dance", name: "Dance", tagline: "Turns, combos, recital clips.", image: "/images/hobbies/dance-3.png" },
  { slug: "anime", name: "Anime", tagline: "Season takes, fan art, watch parties.", image: "/images/hobbies/anime-3.png" },
  { slug: "singing", name: "Singing", tagline: "Covers, open mics, vocal runs.", image: "/images/hobbies/singing-3.png" },
  { slug: "gaming", name: "Gaming", tagline: "Clips, raids, patch-note arguments.", image: "/images/hobbies/gaming-3.png" },
  { slug: "art", name: "Art", tagline: "Sketchbooks, WIPs, critique threads.", image: "/images/hobbies/art-3.png" },
  { slug: "fitness", name: "Fitness", tagline: "PRs, form checks, recovery days.", image: "/images/hobbies/fitness-3.png" },
];

function Featured() {
  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="font-bnt text-chblack text-3xl sm:text-4xl">Find your hobby</h2>
          <p className="font-pop mt-3 text-chblack/70 max-w-xl mx-auto">
            Six communities live today. More launching as they grow. Request one once you&apos;re in.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {HOBBIES.map((hobby) => (
            <Link key={hobby.slug} href="/signup" className="group block">
              <div className="relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow aspect-[4/5]">
                <Image
                  src={hobby.image}
                  alt={`${hobby.name} community`}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="font-bnt text-white text-xl sm:text-2xl">{hobby.name}</h3>
                </div>
              </div>
              <p className="font-pop text-sm text-chblack/70 mt-2">{hobby.tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Featured;
