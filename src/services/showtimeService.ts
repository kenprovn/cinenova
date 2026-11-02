import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Showtime, Movie, Cinema } from '../types';
import { MOCK_SHOWTIMES } from '../data/mockData';
import { resolveMovieId, UUID_REGEX } from './movieService';
import { resolveCinemaId } from './cinemaService';

export const MOCK_TO_REAL_SHOWTIME_ID: Record<string, string> = {
  st1: 's1000000-0000-0000-0000-000000000001',
  st2: 's1000000-0000-0000-0000-000000000002',
  st3: 's1000000-0000-0000-0000-000000000003',
  st4: 's1000000-0000-0000-0000-000000000004',
  st5: 's1000000-0000-0000-0000-000000000005',
};

export function resolveShowtimeId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase().trim();
  return MOCK_TO_REAL_SHOWTIME_ID[lower] || id;
}

export function formatToVietnamDate(dateObj: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj); // YYYY-MM-DD
}

export function formatToVietnamTime(dateObj: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dateObj); // HH:mm
}

export function mapDbShowtimeToShowtime(row: any, cinemaName?: string, hallName?: string): Showtime {
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);

  const dateStr = formatToVietnamDate(startsAt);
  const startTimeStr = formatToVietnamTime(startsAt);
  const endTimeStr = formatToVietnamTime(endsAt);

  return {
    id: row.id,
    movieId: row.movie_id,
    cinemaId: row.rooms?.cinema_id || row.cinema_id || '',
    cinemaName: cinemaName || row.rooms?.cinemas?.name || 'CINENOVA',
    hallId: row.room_id,
    hallName: hallName || row.rooms?.name || 'Phòng Chiếu',
    date: dateStr,
    startTime: startTimeStr,
    endTime: endTimeStr,
    format: row.format,
    priceRegular: Number(row.price_regular),
    priceVip: Number(row.price_vip),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export const showtimeService = {
  async getShowtimes(
    movieId?: string,
    cinemaId?: string,
    dateStr?: string
  ): Promise<{ data: Showtime[]; isFromDb: boolean; error?: string }> {
    const targetMovieId = movieId ? resolveMovieId(movieId) : undefined;
    const targetCinemaId = cinemaId ? resolveCinemaId(cinemaId) : undefined;

    if (!isSupabaseConfigured) {
      let filtered = MOCK_SHOWTIMES;
      if (targetMovieId) {
        filtered = filtered.filter((s) => s.movieId === targetMovieId || s.movieId === movieId);
      }
      if (targetCinemaId) {
        filtered = filtered.filter((s) => s.cinemaId === targetCinemaId || s.cinemaId === cinemaId);
      }
      if (dateStr) {
        filtered = filtered.filter((s) => s.date === dateStr);
      }
      return { data: filtered, isFromDb: false };
    }

    try {
      let query = supabase
        .from('showtimes')
        .select(`
          *,
          rooms:room_id (
            id,
            name,
            cinema_id,
            cinemas:cinema_id (
              id,
              name
            )
          )
        `)
        .eq('status', 'scheduled')
        .order('starts_at', { ascending: true });

      if (targetMovieId && UUID_REGEX.test(targetMovieId)) {
        query = query.eq('movie_id', targetMovieId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[showtimeService] Supabase query error:', error.message);
        return { data: [], isFromDb: true, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], isFromDb: true };
      }

      let mapped = data.map((row: any) =>
        mapDbShowtimeToShowtime(row, row.rooms?.cinemas?.name, row.rooms?.name)
      );

      if (targetCinemaId) {
        mapped = mapped.filter((st) => st.cinemaId === targetCinemaId);
      }

      if (dateStr) {
        mapped = mapped.filter((st) => st.date === dateStr);
      }

      return { data: mapped, isFromDb: true };
    } catch (err: any) {
      console.error('[showtimeService] Unexpected error:', err);
      return { data: [], isFromDb: true, error: err.message };
    }
  },

  async getShowtimeById(id: string): Promise<{
    data: Showtime | null;
    movie?: Movie | null;
    cinema?: Cinema | null;
    isFromDb: boolean;
    error?: string;
  }> {
    const resolvedId = resolveShowtimeId(id);

    if (!isSupabaseConfigured) {
      const found = MOCK_SHOWTIMES.find((s) => s.id === resolvedId || s.id === id) || null;
      return { data: found, isFromDb: false };
    }

    try {
      if (!UUID_REGEX.test(resolvedId)) {
        return { data: null, isFromDb: true, error: 'ID suất chiếu không đúng định dạng UUID.' };
      }

      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          movies:movie_id (*),
          rooms:room_id (
            id,
            name,
            cinema_id,
            cinemas:cinema_id (*)
          )
        `)
        .eq('id', resolvedId)
        .maybeSingle();

      if (error) {
        return { data: null, isFromDb: true, error: error.message };
      }

      if (!data) {
        return { data: null, isFromDb: true, error: 'Suất chiếu không tồn tại' };
      }

      const mapped = mapDbShowtimeToShowtime(data, data.rooms?.cinemas?.name, data.rooms?.name);

      let movieObj: Movie | null = null;
      if (data.movies) {
        movieObj = {
          id: data.movies.id,
          title: data.movies.title,
          originalTitle: data.movies.title,
          slug: data.movies.id,
          posterUrl: data.movies.poster_url,
          bannerUrl: data.movies.backdrop_url || data.movies.poster_url,
          trailerUrl: data.movies.trailer_url || '',
          duration: data.movies.duration_minutes,
          releaseDate: data.movies.release_date,
          ageRating: data.movies.age_rating,
          genres: data.movies.genres || ['Điện ảnh'],
          director: data.movies.director || 'CINENOVA',
          cast: data.movies.cast_members || [],
          synopsis: data.movies.description || '',
          rating: Number(data.movies.rating) || 8.5,
          reviewCount: 120,
          isNowShowing: data.movies.status === 'now_showing',
          isComingSoon: data.movies.status === 'coming_soon',
          isFeatured: true,
        };
      }

      let cinemaObj: Cinema | null = null;
      if (data.rooms?.cinemas) {
        cinemaObj = {
          id: data.rooms.cinemas.id,
          name: data.rooms.cinemas.name,
          address: data.rooms.cinemas.address,
          city: data.rooms.cinemas.city,
          phone: data.rooms.cinemas.phone || '1900 6017',
        };
      }

      return { data: mapped, movie: movieObj, cinema: cinemaObj, isFromDb: true };
    } catch (err: any) {
      return { data: null, isFromDb: true, error: err.message };
    }
  },

  async checkOverlap(roomId: string, startsAt: string, endsAt: string, excludeShowtimeId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      let query = supabase
        .from('showtimes')
        .select('id, starts_at, ends_at')
        .eq('room_id', roomId)
        .eq('status', 'scheduled')
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt);

      if (excludeShowtimeId) {
        query = query.neq('id', excludeShowtimeId);
      }

      const { data, error } = await query;
      if (error) return false;
      return (data && data.length > 0);
    } catch {
      return false;
    }
  },

  async createShowtime(payload: {
    movieId: string;
    roomId: string;
    startsAt: string;
    endsAt: string;
    format: '2D Digital' | '3D' | 'IMAX Laser';
    priceRegular: number;
    priceVip: number;
  }): Promise<{ data: Showtime | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Chưa cấu hình Supabase.' };
    }

    const targetMovieId = resolveMovieId(payload.movieId);

    // Client-side overlap validation before insert
    const isOverlapping = await this.checkOverlap(payload.roomId, payload.startsAt, payload.endsAt);
    if (isOverlapping) {
      return {
        data: null,
        error: 'Khung giờ này đã bị trùng với một suất chiếu khác trong cùng phòng chiếu.',
      };
    }

    try {
      const { data, error } = await supabase
        .from('showtimes')
        .insert({
          movie_id: targetMovieId,
          room_id: payload.roomId,
          starts_at: payload.startsAt,
          ends_at: payload.endsAt,
          format: payload.format,
          price_regular: payload.priceRegular,
          price_vip: payload.priceVip,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: mapDbShowtimeToShowtime(data), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async cancelShowtime(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Chưa cấu hình Supabase.' };
    }

    const resolvedId = resolveShowtimeId(id);

    try {
      // Soft-delete to preserve booking history integrity
      const { error } = await supabase
        .from('showtimes')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', resolvedId);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
