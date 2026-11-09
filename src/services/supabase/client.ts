"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/services/env";
import type { Database } from "./types/types";

export const createClient = () =>
  createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey, {
    db: {
      schema: "portfolio",
    },
  });
