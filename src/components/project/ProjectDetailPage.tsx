import { inkvokerProject } from "../../data/projectData";
import ContactFooter from "../ContactFooter";
import SectionDivider from "../SectionDivider";
import CoreLoop from "./CoreLoop";
import ProjectFeatureGrid from "./ProjectFeatureGrid";
import ProjectGallery from "./ProjectGallery";
import ProjectHero from "./ProjectHero";
import ProjectStatus from "./ProjectStatus";

interface ProjectDetailPageProps {
  onBackToWork: () => void;
}

export default function ProjectDetailPage({ onBackToWork }: ProjectDetailPageProps) {
  return (
    <main id="project-main" className="pt-24 md:pt-28">
      <ProjectHero project={inkvokerProject} onBackToWork={onBackToWork} />
      <SectionDivider />
      <CoreLoop steps={inkvokerProject.loop} />
      <SectionDivider />
      <ProjectFeatureGrid features={inkvokerProject.features} />
      <SectionDivider />
      <ProjectGallery items={inkvokerProject.gallery} />
      <SectionDivider />
      <ProjectStatus project={inkvokerProject} onBackToWork={onBackToWork} />
      <ContactFooter />
    </main>
  );
}
