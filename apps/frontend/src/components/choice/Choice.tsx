"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const COMMUNITIES = [
  { key: "singing", image: "/images/sing.png", label: "Singing Community" },
  { key: "anime", image: "/images/anime.png", label: "Anime Community" },
  { key: "dance", image: "/images/dance.png", label: "Dance Community" },
];

function Choice() {
  const router = useRouter();

  const handleChoice = (option: string) => {
    router.push(`/dashboard?choice=${option}`);
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-8 md:p-10">
      <motion.h1
        className="text-4xl md:text-5xl lg:text-6xl font-bnt font-bold text-black mb-8 md:mb-12 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Choose a Community to Join
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full max-w-6xl"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      >
        {COMMUNITIES.map((community) => (
          <motion.button
            key={community.key}
            type="button"
            className="relative group cursor-pointer w-full h-56 sm:h-64 md:h-72 text-left"
            onClick={() => handleChoice(community.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={community.image}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300 ease-in-out"
              alt={community.label}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute bottom-4 left-4 right-4 font-semibold font-pop text-lg md:text-xl lg:text-2xl text-white">
              {community.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default Choice;
