import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Cinema, Room } from '../types';
import { MOCK_CINEMAS } from '../data/mockData';

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

  async getRoomsByCinema(cinemaId: string): Promise<Room[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('cinema_id', cinemaId)
        .eq('status', 'active');

      if (error || !data) return [];
      return data.map((r) => ({
        id: r.id,
        cinemaId: r.cinema_id,
        name: r.name,
        roomType: r.room_type,
        capacity: r.capacity,
        status: r.status,
      }));
    } catch {
      return [];
    }
  },
};
