import Link from "next/link";
import Logo from "@/components/brand/Logo";

function FinalCTA() {
  return (
    <section className="relative w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20 overflow-hidden">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[28rem] h-56 rounded-full bg-gradient-to-r from-pink-300 to-warber blur-3xl opacity-25" />

      <div className="relative max-w-2xl mx-auto text-center rounded-2xl bg-white shadow-lg px-6 sm:px-10 py-12 sm:py-14">
        <Logo size={44} className="mx-auto" />
        <h2 className="mt-4 font-bnt text-chblack text-4xl sm:text-5xl leading-[1.02]">Your hive is waiting.</h2>
        <p className="font-pop mt-4 text-chblack/70 max-w-md mx-auto">
          Pick a hobby, post your first attempt, and start this week&apos;s challenge. It&apos;s free, and
          the welcome tour gets you going in under a minute.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="font-quick font-semibold px-8 py-3 rounded-full bg-black text-white shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Join HobbyHive
          </Link>
          <Link
            href="/signin"
            className="font-quick font-semibold px-6 py-3 rounded-full border-2 border-chblack/15 text-chblack hover:border-pink-500 hover:text-pink-600 transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
