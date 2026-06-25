import SectionHeading from "./SectionHeading";
import WorkCard from "./WorkCard";
import { featuredWork } from "../data/siteData";
import { useLanguage } from "../i18n/LanguageContext";
import { useScrollSkew } from "../hooks/useScrollSkew";

export default function FeaturedWorkSection() {
  const { t } = useLanguage();
  const skew = useScrollSkew(4);
  return (
    <section id="work" className="section-pad scroll-mt-20 relative">
      <div className="container-lab relative">
        <SectionHeading
          kicker={t({ en: "Featured Work", zh: "精选作品" })}
          title={t({
            en: "Prototypes and systems in active iteration",
            zh: "正在迭代中的原型与系统",
          })}
          description={t({
            en: "A focused selection of what the lab is building right now — playable ideas, visual archives, and character work.",
            zh: "实验室当前正在打造的精选内容——可玩的点子、视觉档案与角色创作。",
          })}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredWork.map((work, i) => (
            <WorkCard key={work.id} work={work} delay={i * 0.08} skew={skew} />
          ))}
        </div>
      </div>
    </section>
  );
}
