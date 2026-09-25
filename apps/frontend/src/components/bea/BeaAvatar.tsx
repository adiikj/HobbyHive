/** Bea's face: a friendly bee with reading glasses (she's read everything the hive has shared). */
function BeaAvatar({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/bea.svg" alt="" aria-hidden="true" width={size} height={size} className="shrink-0 select-none" draggable={false} />
  );
}

export default BeaAvatar;
