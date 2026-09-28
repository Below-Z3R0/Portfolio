import type { Database } from "./types";

// Helpers para acceder a las tablas de tu schema
type PortfolioSchema = Database["portfolio"];
type PortfolioTables = PortfolioSchema["Tables"];

// Tipo fila de cada tabla (lo que devuelve SELECT)
export type ContentBlock = PortfolioTables["content_blocks"]["Row"];
export type Translation = PortfolioTables["translations"]["Row"];
export type ContentBlockMetadata =
  PortfolioTables["content_blocks_metadata"]["Row"];
export type Language = PortfolioTables["languages"]["Row"];

// Helper genérico para el cliente tipado al schema "portfolio"
export type PortfolioClient = import("@supabase/supabase-js").SupabaseClient<
  Database,
  "portfolio"
>;
