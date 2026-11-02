-- ==============================================================================
-- CINENOVA: READ-ONLY AUDIT SCRIPT CHO SUPABASE SQL EDITOR (ADMIN / SUPERUSER)
-- ==============================================================================
-- HƯỚNG DẪN:
-- 1. Mở Supabase Dashboard -> Project CINENOVA -> SQL Editor -> New Query.
-- 2. Dán toàn bộ nội dung file này và bấm RUN.
-- 3. Toàn bộ các câu lệnh bên dưới là CHỈ ĐỌC (SELECT), 100% không làm thay đổi dữ liệu.
-- 4. Khi chạy trong SQL Editor với vai trò postgres (service_role), truy vấn sẽ
--    BỎ QUA RLS (Bypass RLS) để nhìn thấy chính xác 100% mọi bản ghi, kể cả bản ghi 'hidden'.
-- ==============================================================================

-- BƯỚC 1: TỔNG HỢP SỐ LƯỢNG PHIM THEO TỪNG TRẠNG THÁI (Bao gồm hidden)
SELECT 
    COALESCE(status, 'NULL') AS movie_status,
    COUNT(*) AS total_count
FROM public.movies
GROUP BY status
ORDER BY total_count DESC;

-- BƯỚC 2: LIỆT KÊ TẤT CẢ CÁC BẢN GHI PHIM ĐANG CÓ TRONG DATABASE
SELECT 
    id,
    title,
    original_title,
    status,
    age_rating,
    release_date,
    created_at
FROM public.movies
ORDER BY created_at ASC;

-- BƯỚC 3: KIỂM TRA XEM ĐÃ CÓ CỘT tmdb_id VÀ BẢN GHI NÀO ĐÃ CÓ tmdb_id CHƯA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'movies' AND column_name = 'tmdb_id'
    ) THEN
        RAISE NOTICE 'Cột tmdb_id ĐÃ TỒN TẠI trong bảng public.movies.';
    ELSE
        RAISE NOTICE 'Cột tmdb_id CHƯA TỒN TẠI (sẽ được tạo an toàn qua migration Bước 1).';
    END IF;
END $$;

-- BƯỚC 4: KIỂM TRA LIÊN KẾT SUẤT CHIẾU & ĐƠN HÀNG (BẢO TOÀN DOANH THU & BOOKING)
SELECT 
    m.id AS movie_id,
    m.title,
    m.status,
    COUNT(DISTINCT s.id) AS active_showtimes_count,
    COUNT(DISTINCT b.id) AS active_bookings_count,
    COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'confirmed'), 0) AS confirmed_revenue
FROM public.movies m
LEFT JOIN public.showtimes s ON s.movie_id = m.id
LEFT JOIN public.bookings b ON b.showtime_id = s.id
GROUP BY m.id, m.title, m.status
ORDER BY confirmed_revenue DESC, active_bookings_count DESC, active_showtimes_count DESC;

-- BƯỚC 5: KIỂM TRA CẤU TRÚC RÀNG BUỘC CHECK HIỆN TẠI CỦA CỘT age_rating
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' 
  AND c.conrelid = 'public.movies'::regclass
  AND conname LIKE '%age_rating%';

