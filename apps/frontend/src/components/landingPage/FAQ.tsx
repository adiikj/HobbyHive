const QUESTIONS = [
  {
    q: "Can I pick more than one hobby?",
    a: "Yes. Pick as many as you're into. Your feed blends just those, nothing else.",
  },
  {
    q: "What if my hobby isn't listed yet?",
    a: "We're launching with six communities and adding more as they grow — request yours from settings once you're in.",
  },
  {
    q: "Does it cost anything to join?",
    a: "No — signing up is free.",
  },
  {
    q: "Do I need to follow people to see content?",
    a: "No. Your feed is scoped by hobby, not by who you follow. Follow people if you want a curated \"following\" view too, but the hobby feed works from day one.",
  },
  {
    q: "Can I change my hobbies later?",
    a: "Yes, add or drop hobbies anytime from settings — no penalty, your feed just follows.",
  },
];

function FAQ() {
  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-xl mx-auto">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl text-center mb-10 sm:mb-14">
          Questions people actually ask
        </h2>

        <div className="space-y-5">
          {QUESTIONS.map((item) => (
            <div key={item.q}>
              {/* Question — incoming message */}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm shrink-0" />
                <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm px-4 py-2.5 max-w-[85%]">
                  <p className="font-quick font-semibold text-sm text-chblack">{item.q}</p>
                </div>
              </div>
              {/* Answer — HobbyHive reply */}
              <div className="flex justify-end mt-2">
                <div className="bg-pink-600 text-white rounded-2xl rounded-br-sm shadow-sm px-4 py-2.5 max-w-[85%]">
                  <p className="font-pop text-sm">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
