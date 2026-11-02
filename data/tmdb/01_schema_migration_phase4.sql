-- ==============================================================================
-- CINENOVA – Phase 4: Schema Safety Migration (File 01/02)
-- Purpose: Relax age_rating constraint, add certification_origin, tmdb_id, overview_en
-- Safety: Zero data loss, zero destructive actions, idempotent (IF EXISTS/IF NOT EXISTS)
-- ==============================================================================

-- 1. Relax NOT NULL and CHECK constraint on public.movies.age_rating to permit unrated movies (NULL / UNRATED)
ALTER TABLE public.movies ALTER COLUMN age_rating DROP NOT NULL;
ALTER TABLE public.movies DROP CONSTRAINT IF EXISTS movies_age_rating_check;
ALTER TABLE public.movies ADD CONSTRAINT movies_age_rating_check
  CHECK (age_rating IS NULL OR age_rating IN ('P', 'K', 'T13', 'T16', 'T18', 'C', 'UNRATED'));

-- 2. Add columns: certification_origin, tmdb_id, overview_en
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS certification_origin TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS overview_en TEXT;

-- 3. Create Unique Partial Index on tmdb_id (enforcing TMDB ID uniqueness for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON public.movies(tmdb_id) WHERE tmdb_id IS NOT NULL;
