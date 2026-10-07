import { getSiteData } from "@/services/data/site";
import { SectionReveal } from "../components/animations/Animations";
import {
  AboutMeSection,
  Footer,
  Header,
  HeroSection,
  ProjectsSection,
  SkillsSection,
} from "../components/components";
import { ContactSection } from "@/components/organims/ContactSection";

interface PageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentLang = resolvedParams.lang || "es";
  const { content, metadata } = await getSiteData(currentLang);

  const nav_data = { data: content["section.navbar"].data };
  const hero_data = { data: content["section.hero"], meta: { general: metadata["section.hero"], contacts: metadata["general.contacts"], }, };
  const skills_data = { data: content["section.skills"], meta: metadata["section.skills"], };
  const aboutme_data = { data: content["section.aboutme"], meta: metadata["section.aboutme"], };
  const contact_data = { data: content["section.contact"], meta: Object.values(metadata["general.contacts"]), };
  const footer_data = { data: content["section.footer"], meta: content["section.navbar"].data, };
  const projects_array_data = [
    { key: 1, data: content["project.centeno-advisory"], meta: metadata["project.centeno-advisory"] },
    { key: 2, data: content["project.centeno-advisory-db"], meta: metadata["project.centeno-advisory-db"] },
    { key: 3, data: content["project.centeno-advisory-features"], meta: metadata["project.centeno-advisory-features"] },
    { key: 4, data: content["project.portfolio"], meta: metadata["project.portfolio"] },
  ];
  return (
    <>
      <Header nav_data={nav_data} />

      <main id="main-content" className="flex flex-col gap-60 max-w-241.5 mx-auto px-5">
        <SectionReveal>
          <HeroSection hero_data={hero_data} />
        </SectionReveal>

        <SectionReveal>
          <SkillsSection skills_data={skills_data} />
        </SectionReveal>

        <SectionReveal>
          <ProjectsSection
            project_section_data={content["section.projects"]}
            projects_array_data={projects_array_data}
            currentLang={currentLang}
          />
        </SectionReveal>

        <SectionReveal>
          <AboutMeSection aboutme_data={aboutme_data} />
        </SectionReveal>

        <SectionReveal>
          <ContactSection contact_data={contact_data} />
        </SectionReveal>
      </main>

      <Footer footer_data={footer_data} />
    </>
  );
}