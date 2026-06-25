import Reveal from "./Reveal";
import SplitText from "./SplitText";

interface SectionHeadingProps {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <Reveal
      className={`flex flex-col gap-4 ${
        isCenter ? "items-center text-center" : "items-start"
      }`}
    >
      <span className="eyebrow">{kicker}</span>
      <h2 className={`h-section text-balance ${isCenter ? "max-w-2xl" : "max-w-3xl"}`}>
        {/* key forces a re-split when the language (and thus title) changes */}
        <SplitText key={title} text={title} spread={560} />
      </h2>
      {description && (
        <p className="max-w-2xl text-balance text-base leading-relaxed text-accent-silver/60 md:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
