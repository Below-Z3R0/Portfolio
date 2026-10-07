import { getGeneralData } from "@/services/generaldata.service";
import { SectionReveal } from "../components/animations/Animations";
import {
  AboutMeSection,
  Footer,
  Header,
  HeroSection,
  IASection,
  OSSection,
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
  const general_data = await getGeneralData(currentLang);
  return (
    <>
      <Header nav_data={general_data.navbar_section} />

      <main id="main-content" className="flex flex-col gap-60 max-w-241.5 mx-auto px-5">
        <SectionReveal>
          <HeroSection hero_data={general_data.hero_section} />
        </SectionReveal>

        <SectionReveal>
          <SkillsSection skills_data={general_data.skills_section} />
        </SectionReveal>

        <SectionReveal>
          <ProjectsSection
            project_section_data={general_data.projects_section}
            projects_array_data={general_data.projects_array}
            currentLang={currentLang}
          />

        </SectionReveal>
        
        <SectionReveal>
          <AboutMeSection aboutme_data={general_data.aboutme_section} />
        </SectionReveal>

        <SectionReveal>
          <ContactSection contact_data={general_data.contact_section} />
        </SectionReveal>

      </main>

      <Footer footer_data={general_data.footer_section} />
    </>
  );
}
