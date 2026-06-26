import type { ProjectGalleryItem } from "../../data/projectData";
import { useLanguage } from "../../i18n/LanguageContext";
import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";

export default function ProjectGallery({ items }: { items: ProjectGalleryItem[] }) {
  const { t } = useLanguage();

  return (
    <section id="project-gallery" className="section-pad scroll-mt-24">
      <div className="container-lab">
        <SectionHeading
          num="03"
          subtitle="视觉档案"
          kicker={t({ en: "Visual Archive", zh: "视觉档案" })}
          title={t({ en: "Real assets from the prototype", zh: "来自原型的真实素材" })}
          description={t({
            en: "Maps, sprite sheets, skill effects, and combo fields pulled straight from the project. Each tile is labeled by source.",
            zh: "地图、精灵表、技能特效与组合场地都直接取自项目本体，每张图都按来源标注。",
          })}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={`${item.src}-${index}`} delay={index * 0.04}>
              <figure className="group overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.035]">
                <img
                  src={item.src}
                  alt={t(item.alt)}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <figcaption className="flex items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium text-white">{t(item.label)}</span>
                  <span className="chip !py-0.5 !text-[10px]">
                    {item.kind === "concept-visual"
                      ? t({ en: "Concept", zh: "概念" })
                      : t({ en: "Real asset", zh: "真实素材" })}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
