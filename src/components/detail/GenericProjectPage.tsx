import type { DetailPage } from "../../data/detailPages";
import ContactFooter from "../ContactFooter";
import SectionDivider from "../SectionDivider";
import DetailHero from "./DetailHero";
import DetailSectionBlock from "./DetailSectionBlock";
import DetailRelatedLinks from "./DetailRelatedLinks";

/**
 * GenericProjectPage — template for Featured Work cards that are bodies of work
 * (Visual Experiments, Pixel Character Lab) rather than the custom Inkvoker
 * page. Data-driven: sections come straight from the DetailPage.
 */
export default function GenericProjectPage({ page }: { page: DetailPage }) {
  const firstSectionId = page.sections[0]?.id;

  return (
    <main id="detail-main" className="pt-24 md:pt-28">
      <DetailHero
        kicker={page.kicker}
        title={page.title}
        summary={page.summary}
        heroImage={page.heroImage}
        firstSectionId={firstSectionId}
        ctaLabel={{ en: "Explore", zh: "开始浏览" }}
      />
      {page.sections.map((section, i) => (
        <div key={section.id}>
          <SectionDivider />
          <DetailSectionBlock section={section} num={String(i + 1).padStart(2, "0")} />
        </div>
      ))}
      {page.related && page.related.length > 0 && (
        <>
          <SectionDivider />
          <DetailRelatedLinks links={page.related} />
        </>
      )}
      <ContactFooter />
    </main>
  );
}
