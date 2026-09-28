import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    loader: "custom",
    loaderFile: "./src/services/assets/supabase-image-loader.ts",
  },
};

export default nextConfig;
