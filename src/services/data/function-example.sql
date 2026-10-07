-- =============================================================================
-- get_site_payload: trae todo el contenido + metadata del sitio en 1 sola query.
--
-- Devuelve un jsonb con shape:
-- {
--   content:  { [block_key]: <jsonb content>, ... },
--   metadata: { [block_key]: <jsonb metadata>, ... }
-- }
--
-- Donde cada content/metadata viene de:
--   - portfolio.content_blocks              (catálogo de bloques)
--   - portfolio.translations                (textos traducibles por idioma)
--   - portfolio.content_blocks_metadata     (datos no traducibles, por bloque)
--
-- Uso desde el cliente:
--   supabase.rpc('get_site_payload', { p_lang: 'es' })
--
-- Notas:
--   - language=sql + stable: el resultado depende solo de los inputs,
--     Postgres puede cachearlo dentro del mismo statement.
--   - security invoker: respeta RLS (corre con el rol del que llama).
--   - coalesce(..., '{}'): si no hay traducciones/metadata, devuelve {} en vez de NULL.
-- =============================================================================

create or replace function portfolio.get_site_payload(p_lang text, p_keys text[] default null)
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'content', coalesce((
      select jsonb_object_agg(cb.key, t.content)
      from portfolio.content_blocks cb
      join portfolio.translations t on t.block_id = cb.id
      where t.lang_code = p_lang
        and (p_keys is null or cb.key = any(p_keys))
    ), '{}'::jsonb),
    'metadata', coalesce((
      select jsonb_object_agg(cb.key, m.content)
      from portfolio.content_blocks cb
      join portfolio.content_blocks_metadata m on m.block_id = cb.id
      where p_keys is null or cb.key = any(p_keys)
    ), '{}'::jsonb)
  );
$$;

-- =============================================================================
-- Cómo probarlo desde el SQL Editor de Supabase:
-- =============================================================================
--
--   select portfolio.get_site_payload('es');
--   select portfolio.get_site_payload('en');
--
--   -- Con filtro de keys (lo que usa la app desde site.ts):
--   select portfolio.get_site_payload('es', array['section.hero', 'project.nincy']);
--
-- =============================================================================
-- Cómo correrlo desde tu app (src/services/data/site.ts):
-- =============================================================================
--
--   const { data, error } = await supabase.rpc('get_site_payload', {
--     p_lang: 'es',
--   });
--
-- =============================================================================
-- Mantenimiento:
-- =============================================================================
--
-- 1. Si agregás un campo nuevo a translations.content o content_blocks_metadata,
--    este RPC lo trae automáticamente (jsonb_object_agg no requiere definir
--    columnas explícitas).
--
-- 2. Si querés agregar un JOIN a otra tabla (ej: imágenes desde Storage), agregás
--    otra rama en el jsonb_build_object:
--
--      'images', coalesce((
--        select jsonb_object_agg(cb.key, img.url)
--        from portfolio.content_blocks cb
--        join portfolio.block_images img on img.block_id = cb.id
--      ), '{}'::jsonb),
--
-- 3. Si querés limitar qué bloques se traen (ej: solo los marcados como públicos),
--    agregá un filtro en el WHERE:
--
--      where cb.is_public = true and t.lang_code = p_lang
--
-- 4. Para regenerar los tipos de Supabase después de crear/modificar el RPC:
--
--      bunx supabase gen types typescript --project-id <PROJECT_ID> \
--        --schema portfolio > src/services/supabase/types/types.ts
--