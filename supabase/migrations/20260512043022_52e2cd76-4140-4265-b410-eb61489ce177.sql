
-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.sync_upvote_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten avatars: drop broad SELECT, recreate as object-by-name read only (still works for direct URLs, blocks listing)
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are readable by direct path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND name IS NOT NULL);
