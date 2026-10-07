'use server';
import type { z } from 'zod';
import type { PortfolioClient } from '../supabase/types/types.helper';

export const getData = async <Schema extends z.ZodType>(
  block_key: string,
  lang: string,
  supabase: PortfolioClient,
  schema: Schema,
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from('translations')
    .select('content, content_blocks!inner(key)')
    .eq('lang_code', lang)
    .eq('content_blocks.key', block_key)
    .maybeSingle();

  if (error) {
    console.error(
      `[getData] Supabase error for ${block_key}/${lang}:`,
      error,
    );
    throw new Error(
      `Error fetching data for block_key ${block_key} and language ${lang}: ${error.message}`,
    );
  }

  if (!data) {
    console.error(
      `[getData] No translation found for block_key "${block_key}" and language "${lang}". ` +
        `Verify the block exists in portfolio.content_blocks and a matching row exists in portfolio.translations.`,
    );
    throw new Error(
      `No translation found for block_key "${block_key}" and language "${lang}".`,
    );
  }

  const parseResult = schema.safeParse(data.content);
  if (!parseResult.success) {
    console.error(
      `[getData] Zod validation failed for ${block_key}/${lang}:`,
      parseResult.error,
    );
    console.error(
      `[getData] Actual content received from Supabase:`,
      JSON.stringify(data.content, null, 2),
    );
    throw new Error(
      `Validation failed for ${block_key}/${lang}: ${parseResult.error.message}`,
    );
  }

  return parseResult.data;
};