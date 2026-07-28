function Newsletter() {
  return (
    <section className="relative w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20 overflow-hidden">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[28rem] h-56 rounded-full bg-gradient-to-r from-pink-300 to-warber blur-3xl opacity-25" />

      <div className="relative max-w-2xl mx-auto text-center rounded-xl bg-white shadow-lg px-6 sm:px-10 py-12 sm:py-14">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl">Get a note when a new hobby launches.</h2>
        <p className="font-pop mt-4 text-chblack/70">
          No spam, no algorithm gossip. Just a heads up when your hobby gets its own room.
        </p>

        <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@wherever.com"
            className="font-pop flex-1 rounded-full border border-chgrey/20 px-5 py-3 text-chblack placeholder:text-chblack/40 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            className="font-quick font-semibold rounded-full bg-black text-white px-6 py-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Notify Me
          </button>
        </form>
      </div>
    </section>
  );
}

export default Newsletter;
