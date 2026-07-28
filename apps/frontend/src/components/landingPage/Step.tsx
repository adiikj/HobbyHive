interface StepProps {
  visual: React.ReactNode;
  title: string;
  description: string;
  showArrow?: boolean;
}

function Step({ visual, title, description, showArrow = false }: StepProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="h-20 flex items-center justify-center mb-5">{visual}</div>
      <h3 className="font-quick font-bold text-xl text-chblack mb-2">{title}</h3>
      <p className="font-pop text-chblack/70 text-sm sm:text-base max-w-[220px]">{description}</p>

      {showArrow && (
        <span className="hidden sm:block absolute top-8 -right-4 lg:-right-5 text-chblack/20 text-2xl" aria-hidden="true">
          →
        </span>
      )}
    </div>
  );
}

export default Step;
