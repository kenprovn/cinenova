-- ==============================================================================
-- CINENOVA – Phase 3 Room Type & Showtime Format Guardrail Migration
-- Migration: 20261102000005_room_format_guardrail.sql
-- ==============================================================================

-- 1. Room Format Compatibility Validation Function
-- Guarantees that IMAX Laser showtimes can ONLY be scheduled in rooms equipped with 'imax_laser' technology.
-- Standard, Deluxe, and VIP halls are restricted to '2D Digital' and '3D'.
-- Existing showtimes are preserved and not deleted.
CREATE OR REPLACE FUNCTION public.validate_showtime_room_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_room_name TEXT;
    v_room_type TEXT;
BEGIN
    -- Check if format is IMAX Laser
    IF NEW.format = 'IMAX Laser' THEN
        SELECT name, room_type
        INTO v_room_name, v_room_type
        FROM public.rooms
        WHERE id = NEW.room_id;

        IF v_room_type IS DISTINCT FROM 'imax_laser' THEN
            RAISE EXCEPTION 'Không thể tạo suất chiếu: Phòng "%" (loại: %) không trang bị công nghệ IMAX Laser. Chỉ phòng có loại "imax_laser" mới được lên lịch chiếu định dạng IMAX Laser.',
                v_room_name, v_room_type;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_showtime_room_format() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_showtime_room_format ON public.showtimes;
CREATE TRIGGER trg_validate_showtime_room_format
    BEFORE INSERT OR UPDATE OF room_id, format ON public.showtimes
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_showtime_room_format();

