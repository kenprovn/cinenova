import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Showtime } from '../types';
import { MOCK_SHOWTIMES } from '../data/mockData';

export function mapDbShowtimeToShowtime(row: any, cinemaName?: string, hallName?: string): Showtime {
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);

  const formatDigits = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${startsAt.getFullYear()}-${formatDigits(startsAt.getMonth() + 1)}-${formatDigits(startsAt.getDate())}`;
  const startTimeStr = `${formatDigits(startsAt.getHours())}:${formatDigits(startsAt.getMinutes())}`;
  const endTimeStr = `${formatDigits(endsAt.getHours())}:${formatDigits(endsAt.getMinutes())}`;

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
  };
}

export const showtimeService = {
  async getShowtimes(movieId?: string, cinemaId?: string): Promise<{ data: Showtime[]; isFromDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      let filtered = MOCK_SHOWTIMES;
      if (movieId) filtered = filtered.filter((s) => s.movieId === movieId);
      if (cinemaId) filtered = filtered.filter((s) => s.cinemaId === cinemaId);
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

      if (movieId) query = query.eq('movie_id', movieId);

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        let filtered = MOCK_SHOWTIMES;
        if (movieId) filtered = filtered.filter((s) => s.movieId === movieId);
        if (cinemaId) filtered = filtered.filter((s) => s.cinemaId === cinemaId);
        return { data: filtered, isFromDb: false, error: error?.message };
      }

      let mapped = data.map((row: any) =>
        mapDbShowtimeToShowtime(row, row.rooms?.cinemas?.name, row.rooms?.name)
      );

      if (cinemaId) {
        mapped = mapped.filter((st) => st.cinemaId === cinemaId);
      }

      return { data: mapped, isFromDb: true };
    } catch (err: any) {
      let filtered = MOCK_SHOWTIMES;
      if (movieId) filtered = filtered.filter((s) => s.movieId === movieId);
      if (cinemaId) filtered = filtered.filter((s) => s.cinemaId === cinemaId);
      return { data: filtered, isFromDb: false, error: err.message };
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
          movie_id: payload.movieId,
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

    try {
      // Soft-delete to preserve booking history integrity
      const { error } = await supabase
        .from('showtimes')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
