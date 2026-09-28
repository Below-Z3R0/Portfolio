import { readFileSync } from "node:fs";
import type { z } from "zod";
import {
  AboutMeContentSchema,
  AboutMeMetadataSchema,
  ContactContentSchema,
  FooterContentSchema,
  GeneralContactsSchema,
  GeneralThemesSchema,
  HeroContentSchema,
  HeroMetadataSchema,
  NavbarContentSchema,
  ProjectItemSchema,
  ProjectsContentSchema,
  ProjectsMetadataSchema,
  SkillsContentSchema,
  SkillsMetadataSchema,
} from "../src/components/schemas";

type BlockContent = Record<string, unknown>;

const blocks: Record<
  string,
  {
    es: BlockContent | null;
    en: BlockContent | null;
    meta: BlockContent | null;
  }
> = JSON.parse(readFileSync("/tmp/db_blocks.json", "utf-8"));

type SchemaName =
  | "HeroContent"
  | "NavbarContent"
  | "SkillsContent"
  | "AboutMeContent"
  | "ProjectsContent"
  | "ProjectItem"
  | "ContactContent"
  | "FooterContent"
  | "HeroMetadata"
  | "SkillsMetadata"
  | "AboutMeMetadata"
  | "ProjectsMetadata"
  | "GeneralThemes"
  | "GeneralContacts";

type Result = {
  block: string;
  schema: SchemaName;
  result: "OK" | "FAIL";
  errors?: string[];
};

const SCHEMAS: Record<SchemaName, z.ZodType> = {
  HeroContent: HeroContentSchema,
  NavbarContent: NavbarContentSchema,
  SkillsContent: SkillsContentSchema,
  AboutMeContent: AboutMeContentSchema,
  ProjectsContent: ProjectsContentSchema,
  ProjectItem: ProjectItemSchema,
  ContactContent: ContactContentSchema,
  FooterContent: FooterContentSchema,
  HeroMetadata: HeroMetadataSchema,
  SkillsMetadata: SkillsMetadataSchema,
  AboutMeMetadata: AboutMeMetadataSchema,
  ProjectsMetadata: ProjectsMetadataSchema,
  GeneralThemes: GeneralThemesSchema,
  GeneralContacts: GeneralContactsSchema,
};

const results: Result[] = [];

function validate(
  name: string,
  schemaName: SchemaName,
  data: BlockContent | null,
): Result {
  if (data === null || data === undefined) {
    return { block: name, schema: schemaName, result: "OK" };
  }
  const r = SCHEMAS[schemaName].safeParse(data);
  if (r.success) {
    return { block: name, schema: schemaName, result: "OK" };
  }
  return {
    block: name,
    schema: schemaName,
    result: "FAIL",
    errors: r.error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
    ),
  };
}

const CONTENT_SCHEMAS: Record<string, SchemaName> = {
  "section.hero": "HeroContent",
  "section.navbar": "NavbarContent",
  "section.skills": "SkillsContent",
  "section.aboutme": "AboutMeContent",
  "section.projects": "ProjectsContent",
  "section.contact": "ContactContent",
  "section.footer": "FooterContent",
  "project.centeno-advisory": "ProjectItem",
  "project.centeno-advisory-db": "ProjectItem",
  "project.centeno-advisory-features": "ProjectItem",
  "project.nincy": "ProjectItem",
  "project.portfolio": "ProjectItem",
};

const META_SCHEMAS: Record<string, SchemaName> = {
  "section.hero": "HeroMetadata",
  "section.skills": "SkillsMetadata",
  "section.aboutme": "AboutMeMetadata",
  "project.centeno-advisory": "ProjectsMetadata",
  "project.centeno-advisory-db": "ProjectsMetadata",
  "project.centeno-advisory-features": "ProjectsMetadata",
  "project.nincy": "ProjectsMetadata",
  "project.portfolio": "ProjectsMetadata",
  "general.themes": "GeneralThemes",
  "general.contacts": "GeneralContacts",
};

for (const [key, schemaName] of Object.entries(CONTENT_SCHEMAS)) {
  for (const lang of ["es", "en"] as const) {
    const data = blocks[key]?.[lang] ?? null;
    results.push(validate(`${key} [${lang}]`, schemaName, data));
  }
}

for (const [key, schemaName] of Object.entries(META_SCHEMAS)) {
  const data = blocks[key]?.meta ?? null;
  results.push(validate(`${key} [meta]`, schemaName, data));
}

console.log("=== Zod Schema Validation: BD JSONs vs Code ===\n");
const ok = results.filter((r) => r.result === "OK").length;
const fail = results.filter((r) => r.result === "FAIL").length;
console.log(`Total: ${results.length} | OK: ${ok} | FAIL: ${fail}\n`);

for (const r of results) {
  const icon = r.result === "OK" ? "✓" : "✗";
  console.log(`${icon} [${r.schema.padEnd(20)}] ${r.block}`);
  if (r.errors && r.errors.length > 0) {
    for (const e of r.errors) {
      console.log(`    └─ ${e}`);
    }
  }
}

process.exit(fail > 0 ? 1 : 0);
