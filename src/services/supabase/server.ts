import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/services/env";
import type { Database } from "./types/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component: ignorar error de escritura de cookies
          }
        },
      },
      db: {
        schema: "portfolio",
      },
    },
  );
}
