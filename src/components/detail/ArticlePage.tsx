import type { DetailPage } from "../../data/detailPages";
import ContactFooter from "../ContactFooter";
import SectionDivider from "../SectionDivider";
import DetailHero from "./DetailHero";
import DetailSectionBlock from "./DetailSectionBlock";
import DetailRelatedLinks from "./DetailRelatedLinks";

/**
 * ArticlePage — template for Dev Log entries. Reads as an article: a narrower
 * hero and prose-variant section blocks. The final section is typically "Key
 * Takeaways" (item cards), wired by the data, not special-cased here.
 */
export default function ArticlePage({ page }: { page: DetailPage }) {
  const firstSectionId = page.sections[0]?.id;

  return (
    <main id="detail-main" className="pt-24 md:pt-28">
      <DetailHero
        kicker={page.kicker}
        title={page.title}
        summary={page.summary}
        heroImage={page.heroImage}
        firstSectionId={firstSectionId}
        ctaLabel={{ en: "Read article", zh: "阅读全文" }}
      />
      {page.sections.map((section, i) => (
        <div key={section.id}>
          <SectionDivider />
          <DetailSectionBlock
            section={section}
            num={String(i + 1).padStart(2, "0")}
            variant="article"
          />
        </div>
      ))}
      {page.related && page.related.length > 0 && (
        <>
          <SectionDivider />
          <DetailRelatedLinks links={page.related} heading={{ en: "Related links", zh: "相关链接" }} />
        </>
      )}
      <ContactFooter />
    </main>
  );
}
