
-- Add language and share slug to analysis_history
ALTER TABLE public.analysis_history
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS share_slug text UNIQUE;

-- Community reports
CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid,
  title text NOT NULL,
  snippet text NOT NULL,
  verdict text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  is_published boolean NOT NULL DEFAULT true,
  upvote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reports"
  ON public.community_reports FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.community_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.community_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.community_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_community_reports_updated_at
  BEFORE UPDATE ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Upvotes
CREATE TABLE IF NOT EXISTS public.community_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.community_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);
ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON public.community_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can upvote"
  ON public.community_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvote"
  ON public.community_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Upvote count trigger
CREATE OR REPLACE FUNCTION public.sync_upvote_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_reports SET upvote_count = upvote_count + 1 WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_reports SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER community_upvotes_count
  AFTER INSERT OR DELETE ON public.community_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_upvote_count();

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
