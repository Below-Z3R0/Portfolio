import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import {
  HeroContentSchema,
  NavbarContentSchema,
  SkillsContentSchema,
  AboutMeContentSchema,
  ProjectsContentSchema,
  ContactContentSchema,
  FooterContentSchema,
  ProjectItemSchema,
  HeroMetadataSchema,
  SkillsMetadataSchema,
  AboutMeMetadataSchema,
  ProjectsMetadataSchema,
  GeneralContactsSchema,
} from '@/components/schemas';
import { createClient } from '@/services/supabase/server';

const SitePayloadSchema = z.object({
  content: z.object({
    'section.hero': HeroContentSchema,
    'section.navbar': NavbarContentSchema,
    'section.skills': SkillsContentSchema,
    'section.aboutme': AboutMeContentSchema,
    'section.projects': ProjectsContentSchema,
    'section.contact': ContactContentSchema,
    'section.footer': FooterContentSchema,
    'project.centeno-advisory': ProjectItemSchema,
    'project.centeno-advisory-db': ProjectItemSchema,
    'project.centeno-advisory-features': ProjectItemSchema,
    'project.portfolio': ProjectItemSchema,
  }),
  metadata: z.object({
    'section.hero': HeroMetadataSchema,
    'general.contacts': GeneralContactsSchema,
    'section.skills': SkillsMetadataSchema,
    'section.aboutme': AboutMeMetadataSchema,
    'project.centeno-advisory': ProjectsMetadataSchema,
    'project.centeno-advisory-db': ProjectsMetadataSchema,
    'project.centeno-advisory-features': ProjectsMetadataSchema,
    'project.portfolio': ProjectsMetadataSchema,
  }),
});

export type SitePayload = z.infer<typeof SitePayloadSchema>;

const fetchPayload = async (supabase: any, lang: string): Promise<SitePayload> => {
  // Solo pedimos al RPC las keys que nuestro schema conoce
  const allowedKeys = [
    ...Object.keys(SitePayloadSchema.shape.content.shape),
    ...Object.keys(SitePayloadSchema.shape.metadata.shape),
  ];

  const { data, error } = await supabase.rpc('get_site_payload', {
    p_lang: lang,
    p_keys: allowedKeys,
  });
  if (error) throw new Error(`[site] RPC error: ${error.message}`);

  // Validar content bloque por bloque
  for (const [key, schema] of Object.entries(SitePayloadSchema.shape.content.shape)) {
    const value = data?.content?.[key];
    if (value === undefined) {
      throw new Error(`[site] Missing content for "${key}"`);
    }
    const result = (schema as z.ZodType).safeParse(value);
    if (!result.success) {
      console.error(`[site] Content invalid for "${key}":`, result.error);
      console.error(`[site] Actual content for "${key}":`, JSON.stringify(value, null, 2));
      throw new Error(`[site] Invalid content for "${key}": ${result.error.issues[0]?.message}`);
    }
  }

  for (const [key, schema] of Object.entries(SitePayloadSchema.shape.metadata.shape)) {
    const value = data?.metadata?.[key];
    if (value === undefined) continue;
    const result = (schema as z.ZodType).safeParse(value);
    if (!result.success) {
      console.error(`[site] Metadata invalid for "${key}":`, result.error);
      console.error(`[site] Actual metadata for "${key}":`, JSON.stringify(value, null, 2));
      throw new Error(`[site] Invalid metadata for "${key}": ${result.error.issues[0]?.message}`);
    }
  }

  return SitePayloadSchema.parse(data);
};

export const getSiteData = async (lang: string = 'es'): Promise<SitePayload> => {
  const supabase = await createClient();

  return unstable_cache(
    async () => fetchPayload(supabase, lang),
    ['site-payload', lang],
    { revalidate: 3600, tags: [`site:${lang}`] },
  )();
};