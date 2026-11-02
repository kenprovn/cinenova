-- ==============================================================================
-- CINENOVA – Phase 2 PostgreSQL Schema Migration
-- Migration: 20261102000001_initial_schema.sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on role for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Movies Table
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_title TEXT,
    description TEXT,
    poster_url TEXT NOT NULL,
    backdrop_url TEXT,
    trailer_url TEXT,
    director TEXT,
    cast_members TEXT[] DEFAULT '{}',
    genres TEXT[] DEFAULT '{}',
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    release_date DATE NOT NULL,
    age_rating TEXT NOT NULL CHECK (age_rating IN ('P', 'K', 'T13', 'T16', 'T18', 'C')),
    rating NUMERIC(3,1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 10.0),
    status TEXT NOT NULL DEFAULT 'now_showing' CHECK (status IN ('now_showing', 'coming_soon', 'ended', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_status ON public.movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON public.movies(release_date);

-- 4. Cinemas Table
CREATE TABLE IF NOT EXISTS public.cinemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cinemas_city ON public.cinemas(city);

-- 5. Rooms Table (Phòng chiếu)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cinema_id UUID NOT NULL REFERENCES public.cinemas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL DEFAULT 'standard' CHECK (room_type IN ('standard', 'imax_laser', 'deluxe', 'vip')),
    capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_cinema_id ON public.rooms(cinema_id);

-- 6. Seats Table (Sơ đồ ghế)
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    row_label TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type TEXT NOT NULL DEFAULT 'regular' CHECK (seat_type IN ('regular', 'vip', 'couple')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disabled')),
    UNIQUE (room_id, row_label, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_room_id ON public.seats(room_id);

-- 7. Showtimes Table (Suất chiếu)
CREATE TABLE IF NOT EXISTS public.showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    format TEXT NOT NULL DEFAULT '2D Digital' CHECK (format IN ('2D Digital', '3D', 'IMAX Laser')),
    price_regular NUMERIC(12,2) NOT NULL CHECK (price_regular >= 0),
    price_vip NUMERIC(12,2) NOT NULL CHECK (price_vip >= 0),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

-- Strict Exclusion Constraint: Prevent overlapping showtimes in the same room (excluding cancelled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_showtimes'
    ) THEN
        ALTER TABLE public.showtimes
        ADD CONSTRAINT no_overlapping_showtimes
        EXCLUDE USING gist (
            room_id WITH =,
            tstzrange(starts_at, ends_at) WITH &&
        ) WHERE (status != 'cancelled');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON public.showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_room ON public.showtimes(room_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_starts_at ON public.showtimes(starts_at);

-- 8. Bookings Table (Đơn đặt vé)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    booking_code TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime_id ON public.bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);

-- 9. Booking Seats Table (Chi tiết ghế đã đặt)
CREATE TABLE IF NOT EXISTS public.booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    UNIQUE (booking_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_booking ON public.booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat ON public.booking_seats(seat_id);

-- 10. Seat Holds Table (Giữ ghế tạm thời)
CREATE TABLE IF NOT EXISTS public.seat_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (showtime_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_seat_holds_showtime ON public.seat_holds(showtime_id);
CREATE INDEX IF NOT EXISTS idx_seat_holds_expires_at ON public.seat_holds(expires_at);

-- 11. Payments Table (Thanh toán)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'vnpay', 'card', 'zalopay', 'cash')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);

-- 12. Tickets Table (Vé điện tử & QR Code)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    ticket_code TEXT NOT NULL UNIQUE,
    qr_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON public.tickets(qr_token);

-- ==============================================================================
-- 13. Automatic Profile Creation Trigger for Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(pg_catalog.split_part(NEW.email, '@', 1)), ''),
            'Thành viên CINENOVA'
        ),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
        'customer' -- All signups strictly default to customer (security guardrail)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 14. Automatic updated_at Timestamp Trigger
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_movies_updated_at ON public.movies;
CREATE TRIGGER trg_movies_updated_at
    BEFORE UPDATE ON public.movies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_showtimes_updated_at ON public.showtimes;
CREATE TRIGGER trg_showtimes_updated_at
    BEFORE UPDATE ON public.showtimes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 15. Seat Room Integrity Check: Seat must belong to showtime room
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validate_booking_seat_room()
RETURNS TRIGGER AS $$
DECLARE
    v_showtime_room_id UUID;
    v_seat_room_id UUID;
BEGIN
    -- Lấy room_id từ suất chiếu của đơn đặt vé
    SELECT s.room_id INTO v_showtime_room_id
    FROM public.bookings b
    JOIN public.showtimes s ON s.id = b.showtime_id
    WHERE b.id = NEW.booking_id;

    -- Lấy room_id của ghế được đặt
    SELECT st.room_id INTO v_seat_room_id
    FROM public.seats st
    WHERE st.id = NEW.seat_id;

    IF v_showtime_room_id IS NULL OR v_seat_room_id IS NULL THEN
        RAISE EXCEPTION 'Dữ liệu đơn vé hoặc vị trí ghế không hợp lệ.';
    END IF;

    IF v_showtime_room_id != v_seat_room_id THEN
        RAISE EXCEPTION 'Ghế được chọn không thuộc phòng chiếu của suất chiếu này.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.validate_booking_seat_room() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_booking_seat_room ON public.booking_seats;
CREATE TRIGGER trg_validate_booking_seat_room
    BEFORE INSERT OR UPDATE ON public.booking_seats
    FOR EACH ROW EXECUTE FUNCTION public.validate_booking_seat_room();
