import type { DetailPage } from "../../data/detailPages";
import ContactFooter from "../ContactFooter";
import SectionDivider from "../SectionDivider";
import DetailHero from "./DetailHero";
import DetailSectionBlock from "./DetailSectionBlock";
import DetailRelatedLinks from "./DetailRelatedLinks";

/**
 * LabDetailPage — template for Visual Lab topic pages (Fluid / Sci-fi Effects,
 * Pixel Characters, etc.). Same data-driven shape as GenericProjectPage; kept
 * as its own component so the two families can diverge without entangling.
 */
export default function LabDetailPage({ page }: { page: DetailPage }) {
  const firstSectionId = page.sections[0]?.id;

  return (
    <main id="detail-main" className="pt-24 md:pt-28">
      <DetailHero
        kicker={page.kicker}
        title={page.title}
        summary={page.summary}
        heroImage={page.heroImage}
        firstSectionId={firstSectionId}
        ctaLabel={{ en: "View studies", zh: "查看研究" }}
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
          <DetailRelatedLinks links={page.related} heading={{ en: "Related work", zh: "相关内容" }} />
        </>
      )}
      <ContactFooter />
    </main>
  );
}
