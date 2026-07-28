import Step from "./Step";

function PickVisual() {
  return (
    <div className="flex gap-2">
      <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-pink-600 text-white shadow-sm">Dance</span>
      <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/40 border border-chgrey/15">
        Gaming
      </span>
      <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/40 border border-chgrey/15">
        Art
      </span>
    </div>
  );
}

function FeedVisual() {
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-lg shadow-md p-2.5 w-44">
      <div className="w-7 h-7 rounded-full bg-pink-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <span className="inline-block text-[10px] font-quick font-semibold text-white px-2 py-0.5 rounded-full bg-pink-600">
          Dance
        </span>
        <div className="h-1.5 bg-chblack/10 rounded-full w-4/5" />
      </div>
    </div>
  );
}

function SwapVisual() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-white text-chblack/30 border border-chgrey/15 line-through">
        Dance
      </span>
      <span className="text-chblack/30">→</span>
      <span className="font-quick text-xs px-3 py-1.5 rounded-full bg-pink-600 text-white shadow-sm">Gaming</span>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl mb-12 sm:mb-16 text-center">How it works</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6">
          <Step
            visual={<PickVisual />}
            title="Pick a hobby"
            description="One, or a few. Whatever you actually spend time on."
            showArrow
          />
          <Step
            visual={<FeedVisual />}
            title="Get your feed"
            description="It fills with only that — posts, people, and rooms for it."
            showArrow
          />
          <Step
            visual={<SwapVisual />}
            title="Change it anytime"
            description="Add a hobby, drop one, no penalty. Your feed follows."
          />
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
