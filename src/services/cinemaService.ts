import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Cinema, Room } from '../types';
import { MOCK_CINEMAS } from '../data/mockData';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MOCK_TO_REAL_CINEMA_ID: Record<string, string> = {
  c1: 'c1000000-0000-0000-0000-000000000001', // CINENOVA Landmark Sài Gòn
  c2: 'c1000000-0000-0000-0000-000000000002', // CINENOVA Tây Hồ Hà Nội
  c3: 'c1000000-0000-0000-0000-000000000003', // CINENOVA Sông Hàn Đà Nẵng
};

export function resolveCinemaId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase().trim();
  if (MOCK_TO_REAL_CINEMA_ID[lower]) {
    return MOCK_TO_REAL_CINEMA_ID[lower];
  }
  return id;
}

const FALLBACK_ROOMS: Room[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    name: 'IMAX Laser Hall 1',
    roomType: 'imax_laser',
    capacity: 96,
    status: 'active',
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    name: 'Cinema Hall 2 (Dolby Atmos)',
    roomType: 'standard',
    capacity: 96,
    status: 'active',
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    cinemaId: 'c1000000-0000-0000-0000-000000000002',
    name: 'Phòng Chiếu 1 Deluxe',
    roomType: 'deluxe',
    capacity: 96,
    status: 'active',
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    cinemaId: 'c1000000-0000-0000-0000-000000000003',
    name: 'Hall 3 Standard',
    roomType: 'standard',
    capacity: 96,
    status: 'active',
  },
];

function filterFallbackRooms(cinemaId?: string): Room[] {
  if (!cinemaId) return FALLBACK_ROOMS;
  const targetId = resolveCinemaId(cinemaId);
  return FALLBACK_ROOMS.filter((r) => r.cinemaId === targetId || r.cinemaId === cinemaId);
}

export const cinemaService = {
  async getCinemas(): Promise<{ data: Cinema[]; isFromDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: MOCK_CINEMAS, isFromDb: false };
    }

    try {
      const { data, error } = await supabase
        .from('cinemas')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('[cinemaService] Error fetching cinemas:', error.message);
        return { data: [], isFromDb: true, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], isFromDb: true };
      }

      return {
        data: data.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          city: c.city,
          phone: c.phone || '1900 6868',
        })),
        isFromDb: true,
      };
    } catch (err: any) {
      console.error('[cinemaService] Unexpected error:', err);
      return { data: [], isFromDb: true, error: err.message };
    }
  },

  async getCinemaById(id: string): Promise<Cinema | null> {
    if (!id) return null;
    const resolvedId = resolveCinemaId(id);

    if (isSupabaseConfigured) {
      try {
        if (UUID_REGEX.test(resolvedId)) {
          const { data, error } = await supabase
            .from('cinemas')
            .select('*')
            .eq('id', resolvedId)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              name: data.name,
              address: data.address,
              city: data.city,
              phone: data.phone || '1900 6868',
            };
          }
        }
      } catch (err) {
        console.warn('[cinemaService] Failed to query cinema by ID:', err);
      }
      return null;
    }

    return MOCK_CINEMAS.find((c) => c.id === resolvedId || c.id === id) || null;
  },

  async getRoomsByCinema(cinemaId?: string): Promise<{ data: Room[]; isFromDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: filterFallbackRooms(cinemaId), isFromDb: false };
    }

    const targetCinemaId = cinemaId ? resolveCinemaId(cinemaId) : undefined;

    try {
      let query = supabase.from('rooms').select('*').eq('status', 'active').order('name');

      if (targetCinemaId && UUID_REGEX.test(targetCinemaId)) {
        query = query.eq('cinema_id', targetCinemaId);
      }

      const { data, error } = await query;
      if (error) {
        return { data: filterFallbackRooms(cinemaId), isFromDb: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: filterFallbackRooms(cinemaId), isFromDb: false };
      }

      const mappedRooms: Room[] = data.map((r) => ({
        id: r.id,
        cinemaId: r.cinema_id,
        name: r.name,
        roomType: r.room_type,
        capacity: r.capacity,
        status: r.status,
      }));

      return { data: mappedRooms, isFromDb: true };
    } catch (err: any) {
      return { data: filterFallbackRooms(cinemaId), isFromDb: false, error: err.message };
    }
  },
};
