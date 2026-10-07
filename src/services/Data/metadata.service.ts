'use server';
import type { z } from 'zod';
import type { PortfolioClient } from '../supabase/types/types.helper';

export const getMetaData = async <Schema extends z.ZodType>(
  block_key: string,
  supabase: PortfolioClient,
  schema: Schema,
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from('content_blocks_metadata')
    .select('content, content_blocks!inner(key)')
    .eq('content_blocks.key', block_key)
    .maybeSingle();

  if (error) {
    console.error(`[getMetaData] Supabase error for ${block_key}:`, error);
    throw new Error(
      `Error fetching metadata for block_key ${block_key}: ${error.message}`,
    );
  }

  if (!data) {
    console.error(
      `[getMetaData] No metadata found for block_key "${block_key}". ` +
        `Verify a matching row exists in portfolio.content_blocks_metadata.`,
    );
    throw new Error(`No metadata found for block_key "${block_key}".`);
  }

  const parseResult = schema.safeParse(data.content);
  if (!parseResult.success) {
    console.error(
      `[getMetaData] Zod validation failed for ${block_key}:`,
      parseResult.error,
    );
    console.error(
      `[getMetaData] Actual content received from Supabase:`,
      JSON.stringify(data.content, null, 2),
    );
    throw new Error(
      `Validation failed for ${block_key}: ${parseResult.error.message}`,
    );
  }

  return parseResult.data;
};