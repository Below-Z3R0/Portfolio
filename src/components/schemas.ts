import { z } from "zod";
import { IconNameSchema } from "../services/assets/icon-registry";

export const SendEmailSchema = z.object({
  name: z.string().min(2, 'Name to short!!').max(80, 'Name to large'),
  user_email: z.email('Invalid email!!').transform(v => v.toLowerCase().trim()),
  title: z.string().min(3, 'Subject to short!!'),
  message: z.string().min(8, 'Message to short!!')
})

export type SendEmail = z.infer<typeof SendEmailSchema>

// =============================================================================
// SCHEMAS COMPARTIDOS
// =============================================================================

export const ContactItemSchema = z.object({
  id: z.number(),
  icon_key: IconNameSchema,
  name: z.string(),
  link: z.string(),
});

export const ContactListSchema = z.array(ContactItemSchema);

// =============================================================================
// GENERAL SCHEMAS (no traducibles, viven en content_blocks_metadata)
// =============================================================================

// general.themes: lista de temas disponibles (light, dark, etc.)
export const GeneralThemesSchema = z.object({
  themes: z.array(z.string()),
});

// ContactSectionMetadata: array de ContactItem (orquestador línea 70 wrappea en array)
export const ContactSectionMetadataSchema = z.array(ContactItemSchema);
export type ContactSectionMetadata = z.infer<
  typeof ContactSectionMetadataSchema
>;

// general.contacts: objeto con redes sociales (github, linkedin, etc.).
// Si necesitás agregar más keys, agregalas explícitamente al schema.
export const GeneralContactsSchema = z.object({
  github: ContactItemSchema,
  linkedin: ContactItemSchema,
});

// =============================================================================
// CONTENT SCHEMAS (translations.content — textos traducibles por idioma)
// =============================================================================

export const HeroContentSchema = z.object({
  title: z.string(),
  contact: z.string(),
  workstatus: z.string(),
  paragraph_1: z.string(),
  paragraph_2: z.string(),
});

// section.navbar en BD: { data: [{ id, link, name }] }
export const NavbarContentSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      link: z.string(),
      name: z.string(),
    }),
  ),
});

export const SkillsContentSchema = z.object({
  title_sm: z.string(),
  title_lg: z.string(),
  paragraph: z.string(),
});

export const AboutMeContentSchema = z.object({
  title_sm: z.string(),
  title_lg: z.string(),
  paragraph_1: z.string(),
  paragraph_2: z.string(),
});

export const ProjectsContentSchema = z.object({
  title_sm: z.string(),
  title_lg: z.string(),
  paragraph: z.string(),
  labels: z.object({
    featured: z.string(),
    in_construction: z.string(),
  }),
});

// Los 5 projects del portfolio comparten este shape
export const ProjectItemSchema = z.object({
  paragraph: z.string(),
  tecnologies: z.array(
    z.object({
      icon_key: IconNameSchema,
      name: z.string(),
      color: z.string(),
      description: z.string(),
    }),
  ),
  modal: z.object({
    img_key: z.string().optional(),
    paragraph: z.string(),
    tecnologies: z.array(
    z.object({
      icon_key: IconNameSchema,
      name: z.string(),
      color: z.string(),
      description: z.string(),
    }),
  ),
  }).optional(),
});

export const FormSchema = z.object({
  send: z.string(),
  sending: z.string(),
  title: z.string(),
  top: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      type: z.string(),
      placeholder: z.string(),
    }),
  ),
  bottom: z.object({
    name: z.string(),
    label: z.string(),
    type: z.string(),
    placeholder: z.string(),
  }),
});

// section.contact en BD: { title_lg, title_sm, paragraph, form }
export const ContactContentSchema = z.object({
  title_lg: z.string(),
  title_sm: z.string(),
  paragraph: z.string(),
  form: FormSchema,
});

// section.footer en BD: { built_with, copyright }
export const FooterContentSchema = z.object({
  built_with: z.string(),
  copyright: z.string(),
});

// =============================================================================
// METADATA SCHEMAS (content_blocks_metadata — datos no traducibles)
// =============================================================================

export const HeroMetadataSchema = z.object({
  image_key: z.string(),
  contact: z.object({
    link: z.string(),
    icon_key: z.string(),
  }),
});

// Navbar no tiene metadata propia en la BD.
// El themes viene de general.themes (ver GeneralThemesSchema arriba).

export const SkillsMetadataSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      skills: z.array(
        z.object({
          name: z.string(),
          color: z.string(),
          icon_key: IconNameSchema,
        }),
      ),
    }),
  ),
});

export const AboutMeMetadataSchema = z.object({
  image_key: z.string(),
});

// Projects metadata: snake_case confirmado en BD oficial.
export const ProjectsMetadataSchema = z.object({
  title: z.string(),
  image_key: z.string().optional(),
  link_github: z.string(),
  link_live_demo: z.string().nullable(),
  is_relevant: z.boolean().optional(),
  is_in_construction: z.boolean().optional(),
});

// =============================================================================
// SECTION TYPES (combina content + metadata, según orquestador)
// =============================================================================

// Hero: meta usa keys 'general' y 'contacts' (orquestador línea 73)
export type HeroSection = {
  data: HeroContent;
  meta: {
    general: HeroMetadata;
    contacts: GeneralContacts;
  };
};

// Navbar: data es el array directo de links (lo unwrappea el orquestador)
export type NavbarItem = NavbarContent["data"][number];
export type NavbarSection = {
  data: NavbarItem[];
};

// Skills
export type SkillsSection = {
  data: SkillsContent;
  meta: SkillsMetadata;
};

// Projects: SIN wrapper — el orquestador retorna directo
export type ProjectsSection = ProjectsContent;

// AboutMe
export type AboutMeSection = {
  data: AboutMeContent;
  meta: AboutMeMetadata;
};

// Contact: meta es array de ContactItem (orquestador línea 78 wrappea en array)
export type ContactSection = {
  data: ContactContent;
  meta: ContactSectionMetadata;
};

// Footer: meta es el array de links del navbar (reusamos NavbarItem[] para los links del pie)
export type FooterSection = {
  data: FooterContent;
  meta: NavbarItem[];
};

// Projects: cada item tiene key + data + meta
export type ProjectBlock = {
  key: number;
  data: ProjectItem;
  meta: ProjectsMetadata;
};
export type ProjectsList = Array<ProjectBlock>;

// =============================================================================
// TIPOS INFERIDOS DE SCHEMAS
// =============================================================================

export type HeroContent = z.infer<typeof HeroContentSchema>;
export type NavbarContent = z.infer<typeof NavbarContentSchema>;
export type SkillsContent = z.infer<typeof SkillsContentSchema>;
export type AboutMeContent = z.infer<typeof AboutMeContentSchema>;
export type ProjectsContent = z.infer<typeof ProjectsContentSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type ModalContent = z.infer<typeof ProjectItemSchema>["modal"];
export type ContactContent = z.infer<typeof ContactContentSchema>;
export type FooterContent = z.infer<typeof FooterContentSchema>;

export type HeroMetadata = z.infer<typeof HeroMetadataSchema>;
export type SkillsMetadata = z.infer<typeof SkillsMetadataSchema>;
export type AboutMeMetadata = z.infer<typeof AboutMeMetadataSchema>;
export type ProjectsMetadata = z.infer<typeof ProjectsMetadataSchema>;

export type GeneralThemes = z.infer<typeof GeneralThemesSchema>;

// GeneralContacts: intersection para autocompletado de github/linkedin + flexibilidad
export type GeneralContacts = z.infer<typeof GeneralContactsSchema>;

export type Contact = z.infer<typeof ContactItemSchema>;
export type ContactList = z.infer<typeof ContactListSchema>;
export type Form = z.infer<typeof FormSchema>;

// =============================================================================
// MAPS DE SCHEMAS (para los services genéricos getData / getMetaData)
// =============================================================================

export const CONTENT_SCHEMAS = {
  "section.hero": HeroContentSchema,
  "section.navbar": NavbarContentSchema,
  "section.skills": SkillsContentSchema,
  "section.aboutme": AboutMeContentSchema,
  "section.projects": ProjectsContentSchema,
  "section.contact": ContactContentSchema,
  "section.footer": FooterContentSchema,
} as const;

export const METADATA_SCHEMAS = {
  "section.hero": HeroMetadataSchema,
  "general.contacts": GeneralContactsSchema,
  "section.skills": SkillsMetadataSchema,
  "section.aboutme": AboutMeMetadataSchema,
} as const;

export const PROJECT_ITEM_SCHEMA = ProjectItemSchema;
export const PROJECT_METADATA_SCHEMA = ProjectsMetadataSchema;

// =============================================================================
// ORQUESTADOR: GeneralData (lo que retorna getGeneralData)
// =============================================================================

export type GeneralData = {
  hero_section: HeroSection;
  navbar_section: NavbarSection;
  skills_section: SkillsSection;
  projects_section: ProjectsSection;
  aboutme_section: AboutMeSection;
  contact_section: ContactSection;
  footer_section: FooterSection;
  projects_array: ProjectsList;
};
