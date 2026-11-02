import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

export const authService = {
  async signUp(email: string, password: string, fullName: string, phone?: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase chưa được cấu hình. Vui lòng kiểm tra .env.local.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Lỗi không xác định khi đăng ký.' };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase chưa được cấu hình. Vui lòng kiểm tra .env.local.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Lỗi không xác định khi đăng nhập.' };
    }
  },

  async signOut(): Promise<AuthResponse> {
    if (!isSupabaseConfigured) return { data: null, error: null };
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getUser() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone || '',
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: { fullName?: string; phone?: string }): Promise<AuthResponse<UserProfile>> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase chưa được cấu hình.' };
    }

    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phone !== undefined) payload.phone = updates.phone;

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return {
        data: {
          id: data.id,
          fullName: data.full_name,
          phone: data.phone,
          role: data.role,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },
};

