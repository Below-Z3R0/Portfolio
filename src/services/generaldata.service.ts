'use server'
import {
  type GeneralData,
  type ContactSectionMetadata,
  CONTENT_SCHEMAS,
  GeneralContactsSchema,
  METADATA_SCHEMAS,
  PROJECT_ITEM_SCHEMA,
  PROJECT_METADATA_SCHEMA,
} from "../components/schemas";
import { getData } from "./Data/data.service";
import { getMetaData } from "./Data/metadata.service";
import { createClient } from "./supabase/server";

export const getGeneralData = async (lang: string = "es",): Promise<GeneralData> => {
  const supabase = await createClient();
  const [
    hero_section,
    navbar_section,
    skills_section,
    projects_section,
    aboutme_section,
    contact_section,
    footer_section,
    centenoadvisory,
    centenoadvisory_db,
    centenoadvisory_features,
    portfolio,
//   nincy, pending...
  ] = await Promise.all([
    getData("section.hero", lang, supabase, CONTENT_SCHEMAS["section.hero"]),
    getData("section.navbar", lang, supabase, CONTENT_SCHEMAS["section.navbar"]),
    getData("section.skills", lang, supabase, CONTENT_SCHEMAS["section.skills"]),
    getData("section.projects", lang, supabase, CONTENT_SCHEMAS["section.projects"]),
    getData("section.aboutme", lang, supabase, CONTENT_SCHEMAS["section.aboutme"]),
    getData("section.contact", lang, supabase, CONTENT_SCHEMAS["section.contact"]),
    getData("section.footer", lang, supabase, CONTENT_SCHEMAS["section.footer"]),

    getData("project.centeno-advisory", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-db", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-features", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.portfolio", lang, supabase, PROJECT_ITEM_SCHEMA),
//    getData("project.nincy", lang, supabase, PROJECT_ITEM_SCHEMA), pending...
  ]);

  const [
    hero_meta,
    skills_section_meta,
    aboutme_section_meta,
    centenoadvisory_meta,
    centenoadvisory_db_meta,
    centenoadvisory_features_meta,
    portfolio_meta,
//    nincy_meta,
    contacts_meta,
  ] = await Promise.all([
    getMetaData("section.hero", supabase, METADATA_SCHEMAS["section.hero"]),
    getMetaData("section.skills", supabase, METADATA_SCHEMAS["section.skills"]),
    getMetaData("section.aboutme", supabase, METADATA_SCHEMAS["section.aboutme"]),
    getMetaData("project.centeno-advisory", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-db", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-features", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.portfolio", supabase, PROJECT_METADATA_SCHEMA),
//    getMetaData("project.nincy", supabase, PROJECT_METADATA_SCHEMA), pending...
    getMetaData("general.contacts", supabase, GeneralContactsSchema),
  ]);

  const contacts_meta_array: ContactSectionMetadata = Object.values(contacts_meta);

  return {
    hero_section: { data: hero_section, meta: { general: hero_meta, contacts: contacts_meta } },
    navbar_section: { data: navbar_section.data },
    skills_section: { data: skills_section, meta: skills_section_meta },
    aboutme_section: { data: aboutme_section, meta: aboutme_section_meta },
    contact_section: { data: contact_section, meta: contacts_meta_array },
    footer_section: { data: footer_section, meta: navbar_section.data },
    projects_section,
    projects_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      { key: 2, data: centenoadvisory_db, meta: centenoadvisory_db_meta },
      { key: 3, data: centenoadvisory_features, meta: centenoadvisory_features_meta },
      { key: 4, data: portfolio, meta: portfolio_meta },
 //     { key: 5, data: nincy, meta: nincy_meta }, pending...
    ],
/*     os_section,
    os_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      { key: 2, data: centenoadvisory_db, meta: centenoadvisory_db_meta },
      { key: 3, data: centenoadvisory_features, meta: centenoadvisory_features_meta },
      { key: 4, data: portfolio, meta: portfolio_meta },
      { key: 5, data: nincy, meta: nincy_meta },
    ],
    ia_section,
    ia_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      { key: 2, data: centenoadvisory_db, meta: centenoadvisory_db_meta },
      { key: 3, data: centenoadvisory_features, meta: centenoadvisory_features_meta },
      { key: 4, data: portfolio, meta: portfolio_meta },
      { key: 5, data: nincy, meta: nincy_meta },
    ],*/
  };
};
