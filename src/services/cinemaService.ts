import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Cinema, Room } from '../types';
import { MOCK_CINEMAS } from '../data/mockData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  return FALLBACK_ROOMS.filter((r) => {
    if (r.cinemaId === cinemaId) return true;
    if (cinemaId === 'c1' && r.cinemaId.endsWith('0001')) return true;
    if (cinemaId === 'c2' && r.cinemaId.endsWith('0002')) return true;
    if (cinemaId === 'c3' && r.cinemaId.endsWith('0003')) return true;
    return false;
  });
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

      if (error || !data || data.length === 0) {
        return { data: MOCK_CINEMAS, isFromDb: false, error: error?.message };
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
      return { data: MOCK_CINEMAS, isFromDb: false, error: err.message };
    }
  },

  async getRoomsByCinema(cinemaId?: string): Promise<{ data: Room[]; isFromDb: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: filterFallbackRooms(cinemaId), isFromDb: false };
    }

    try {
      let query = supabase.from('rooms').select('*').eq('status', 'active').order('name');

      if (cinemaId && UUID_REGEX.test(cinemaId)) {
        query = query.eq('cinema_id', cinemaId);
      }

      const { data, error } = await query;
      if (error) {
        return { data: filterFallbackRooms(cinemaId), isFromDb: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: filterFallbackRooms(cinemaId), isFromDb: false };
      }

      let mappedRooms: Room[] = data.map((r) => ({
        id: r.id,
        cinemaId: r.cinema_id,
        name: r.name,
        roomType: r.room_type,
        capacity: r.capacity,
        status: r.status,
      }));

      if (cinemaId && !UUID_REGEX.test(cinemaId)) {
        mappedRooms = mappedRooms.filter((r) => {
          if (cinemaId === 'c1' && r.cinemaId.endsWith('0001')) return true;
          if (cinemaId === 'c2' && r.cinemaId.endsWith('0002')) return true;
          if (cinemaId === 'c3' && r.cinemaId.endsWith('0003')) return true;
          return false;
        });
      }

      return { data: mappedRooms, isFromDb: true };
    } catch (err: any) {
      return { data: filterFallbackRooms(cinemaId), isFromDb: false, error: err.message };
    }
  },
};

