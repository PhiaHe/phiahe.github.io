import Reveal from "./Reveal";
import SplitText from "./SplitText";

interface SectionHeadingProps {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Editorial section index, e.g. "01" → rendered as "(01)". Opt-in. */
  num?: string;
  /** Outlined (stroked) oversized subtitle pushed to the right of the title
   *  row — borrowed from the reference's `.sec-head .cn`. Usually the ZH label.
   *  Opt-in; when omitted the heading renders exactly as before. */
  subtitle?: string;
}

export default function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  num,
  subtitle,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const editorial = Boolean(num || subtitle);
  return (
    <Reveal
      className={`flex flex-col gap-4 ${
        isCenter ? "items-center text-center" : "items-start"
      }`}
    >
      <span className="eyebrow">
        {num && <span className="mr-2 text-accent-cyan/90">({num})</span>}
        {kicker}
      </span>
      <div
        className={`flex w-full items-baseline gap-4 ${
          editorial ? "flex-wrap" : ""
        }`}
      >
        <h2 className={`h-section text-balance ${isCenter ? "max-w-2xl" : "max-w-3xl"}`}>
          {/* key forces a re-split when the language (and thus title) changes */}
          <SplitText key={title} text={title} spread={560} />
        </h2>
        {subtitle && (
          <span
            aria-hidden="true"
            className="ml-auto select-none font-condensed text-3xl uppercase leading-none tracking-tight text-transparent md:text-5xl"
            style={{ WebkitTextStroke: "1px rgba(199,210,224,0.35)" }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {description && (
        <p className="max-w-2xl text-balance text-base leading-relaxed text-accent-silver/60 md:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
