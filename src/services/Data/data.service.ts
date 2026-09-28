'use server'
import type { z } from "zod";
import type { PortfolioClient } from "../supabase/types/types.helper";

export const getData = async <Schema extends z.ZodType>(
  block_key: string,
  lang: string,
  supabase: PortfolioClient,
  schema: Schema,
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from("translations")
    .select("content, content_blocks!inner(key)")
    .eq("lang_code", lang)
    .eq("content_blocks.key", block_key)
    .limit(1)
    .single();

  if (error || !data)
    throw new Error(
      `Error fetching data for block_key ${block_key} and language ${lang}: ${error.message}`,
    );

  return schema.parse(data.content);
};
