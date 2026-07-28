interface StepProps {
  img: string;
  title: string;
  description: string;
}

function Step({ img, title, description }: StepProps) {
  return (
    <>
      <div className="flex flex-row sm:flex-row items-start sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="w-12 h-12 sm:w-16 sm:h-16" />

        <div className="font-pop text-lg sm:text-2xl pt-2 sm:pt-3 pl-3 text-left font-semibold">
          {title}
        </div>
      </div>

      <div className="font-pop ml-0 sm:ml-20 text-left text-lg sm:text-xl mt-2 sm:mt-3">
        {description}
      </div>
    </>
  );
}

export default Step;
