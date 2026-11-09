import type { ImageLoaderProps } from "next/image";
import { supabaseEnv } from "@/services/env";

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const cleanSrc = src.replace(/^\//, ""); // quita el leading slash

  if (cleanSrc.startsWith("http")) {
    const url = new URL(cleanSrc);
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", (quality ?? 75).toString());
    return url.href;
  }

  return `${supabaseEnv.url}/storage/v1/object/public/project-images/${cleanSrc}?width=${width}&quality=${quality ?? 75}`;
}
