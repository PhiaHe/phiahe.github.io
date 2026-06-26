import type { ProjectStat } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";

interface ProjectStatsProps {
  stats: ProjectStat[];
  /** "compact" packs the strip into the hero column (smaller numbers, tighter
   *  padding). Omitted renders the full-width section variant. */
  variant?: "compact";
}

/**
 * Splits a stat value into its leading number and a trailing non-numeric
 * suffix so the suffix (e.g. "+", "亿", "k") can be accented — an editorial
 * touch borrowed from the LAOGOU reference's `<b>120<em>+</em></b>` stats.
 * "64" -> ["64", ""]; "v0.6" -> ["v0.6", ""]; "35+" -> ["35", "+"].
 */
function splitSuffix(value: string): [string, string] {
  const m = value.match(/^(.*?)([+%·k亿万]+)$/);
  return m ? [m[1], m[2]] : [value, ""];
}

/**
 * ProjectStats — editorial stat strip. No nested cards: a single hairline rule
 * on top, thin dividers between columns, oversized condensed (Anton) numbers,
 * and an accented suffix. The accent stays in the site's cyan rather than the
 * reference's acid yellow, so it reads with the liquid palette.
 */
export default function ProjectStats({ stats, variant }: ProjectStatsProps) {
  const { t } = useLanguage();
  const compact = variant === "compact";

  const grid = (
    <dl className="grid grid-cols-2 border-t border-white/15 sm:grid-cols-4">
      {stats.map((stat, i) => {
        const [num, suffix] = splitSuffix(stat.value);
        return (
          <div
            key={`${stat.value}-${stat.label.en}`}
            className={[
              compact ? "px-3 py-4 sm:px-4 sm:py-5" : "px-4 py-7 sm:px-6 sm:py-9",
              "border-white/10",
              // Right divider on every cell except the last of each row:
              // 2-col (mobile) -> even indexes; 4-col (sm+) -> index%4 !== 3.
              i % 2 === 0 ? "border-r" : "sm:border-r",
              i % 4 !== 3 ? "sm:border-r" : "sm:border-r-0",
            ].join(" ")}
          >
            <dd
              className={
                compact
                  ? "font-condensed text-4xl leading-none tracking-tight text-white md:text-5xl"
                  : "font-condensed text-5xl leading-none tracking-tight text-white md:text-6xl"
              }
            >
              {num}
              {suffix && <span className="text-accent-cyan">{suffix}</span>}
            </dd>
            <dt className="mt-2 font-mono text-[10px] uppercase tracking-ultra text-accent-silver/60 md:text-[11px]">
              {t(stat.label)}
            </dt>
          </div>
        );
      })}
    </dl>
  );

  if (compact) return grid;

  return (
    <section className="container-lab">
      <Reveal>{grid}</Reveal>
    </section>
  );
}
