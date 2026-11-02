import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Movie } from '../types';
import { MOCK_MOVIES } from '../data/mockData';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mapping legacy mock IDs to Supabase public.movies UUIDs
export const MOCK_TO_REAL_MOVIE_ID: Record<string, string> = {
  m1: 'a1000000-0000-0000-0000-000000000001', // Hành Tinh Cát: Phần Hai (Dune: Part Two)
  m2: 'a1000000-0000-0000-0000-000000000002', // Oppenheimer
  m3: 'a1000000-0000-0000-0000-000000000003', // Mai
  m4: 'a1000000-0000-0000-0000-000000000004', // Godzilla x Kong: Đế Chế Mới
  m5: 'a1000000-0000-0000-0000-000000000005', // Kung Fu Panda 4
  m6: 'a1000000-0000-0000-0000-000000000006', // Quỷ Cẩu
  m7: 'a1000000-0000-0000-0000-000000000007', // Kẻ Trộm Mặt Trăng 4
  m8: 'a1000000-0000-0000-0000-000000000008', // Deadpool & Wolverine
  m9: 'a1000000-0000-0000-0000-000000000009', // Joker: Folie à Deux
  m10: 'a1000000-0000-0000-0000-000000000010', // Hố Đen Tử Thần (Interstellar)
};

export function resolveMovieId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase().trim();
  if (MOCK_TO_REAL_MOVIE_ID[lower]) {
    return MOCK_TO_REAL_MOVIE_ID[lower];
  }
  return id;
}

export function isUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function mapDbMovieToMovie(row: any): Movie {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title || '',
    slug: (row.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    posterUrl: row.poster_url,
    bannerUrl: row.backdrop_url || row.poster_url,
    trailerUrl: row.trailer_url || undefined,
    duration: row.duration_minutes,
    releaseDate: row.release_date,
    ageRating: row.age_rating,
    genres: row.genres || [],
    director: row.director || '',
    cast: row.cast_members || [],
    synopsis: row.description || '',
    rating: Number(row.rating) || 0,
    reviewCount: 120,
    isNowShowing: row.status === 'now_showing',
    isComingSoon: row.status === 'coming_soon',
    isFeatured: Number(row.rating) >= 8.5,
  };
}

export const movieService = {
  async getMovies(): Promise<{ data: Movie[]; isFromDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: MOCK_MOVIES, isFromDb: false };
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .neq('status', 'hidden')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('[movieService] Error fetching movies from Supabase:', error.message);
        return { data: [], isFromDb: true, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], isFromDb: true };
      }

      return { data: data.map(mapDbMovieToMovie), isFromDb: true };
    } catch (err: any) {
      console.error('[movieService] Unexpected error in getMovies:', err);
      return { data: [], isFromDb: true, error: err.message };
    }
  },

  async getMovieById(id: string): Promise<Movie | null> {
    if (!id) return null;
    const resolvedId = resolveMovieId(id);

    if (isSupabaseConfigured) {
      try {
        if (UUID_REGEX.test(resolvedId)) {
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('id', resolvedId)
            .maybeSingle();

          if (!error && data) {
            return mapDbMovieToMovie(data);
          }
        } else {
          // If not UUID syntax, attempt lookup by title / original_title
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .or(`title.ilike.%${resolvedId}%,original_title.ilike.%${resolvedId}%`)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            return mapDbMovieToMovie(data);
          }
        }
      } catch (err) {
        console.warn('[movieService] Failed to query movie by ID:', err);
      }
      return null;
    }

    // Only fallback to mock data when Supabase is completely unconfigured
    return MOCK_MOVIES.find((m) => m.id === resolvedId || m.id === id) || null;
  },

  async createMovie(movie: Omit<Movie, 'id'>): Promise<{ data: Movie | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Chưa cấu hình kết nối Supabase Database.' };
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .insert({
          title: movie.title,
          original_title: movie.originalTitle,
          description: movie.synopsis,
          poster_url: movie.posterUrl,
          backdrop_url: movie.bannerUrl,
          trailer_url: movie.trailerUrl || null,
          director: movie.director,
          cast_members: movie.cast,
          genres: movie.genres,
          duration_minutes: movie.duration,
          release_date: movie.releaseDate,
          age_rating: movie.ageRating,
          rating: movie.rating || 0.0,
          status: movie.isNowShowing ? 'now_showing' : movie.isComingSoon ? 'coming_soon' : 'now_showing',
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: mapDbMovieToMovie(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async updateMovie(id: string, updates: Partial<Movie>): Promise<{ data: Movie | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Chưa cấu hình kết nối Supabase Database.' };
    }

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.title) payload.title = updates.title;
      if (updates.originalTitle) payload.original_title = updates.originalTitle;
      if (updates.synopsis) payload.description = updates.synopsis;
      if (updates.posterUrl) payload.poster_url = updates.posterUrl;
      if (updates.bannerUrl) payload.backdrop_url = updates.bannerUrl;
      if (updates.duration) payload.duration_minutes = updates.duration;
      if (updates.ageRating) payload.age_rating = updates.ageRating;
      if (updates.rating !== undefined) payload.rating = updates.rating;
      if (updates.isNowShowing !== undefined) {
        payload.status = updates.isNowShowing ? 'now_showing' : 'coming_soon';
      }

      const { data, error } = await supabase
        .from('movies')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: mapDbMovieToMovie(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async deleteMovie(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Chưa cấu hình Supabase.' };
    }

    try {
      const { error } = await supabase
        .from('movies')
        .update({ status: 'hidden', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
