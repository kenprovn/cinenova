-- ==============================================================================
-- CINENOVA – Phase 2 Seed Data
-- File: supabase/seed.sql
-- Description: Realistic initial seed data for Cinemas, Rooms, Seats, Movies,
--              and Showtimes with strictly valid hexadecimal UUIDs and correct
--              Vietnam Timezone (Asia/Ho_Chi_Minh) TIMESTAMPTZ calculation.
-- Idempotency: Uses ON CONFLICT DO NOTHING to prevent overwriting Admin modifications
--              or breaking existing bookings upon repeated execution.
-- ==============================================================================

-- 1. SEED CINEMAS (Valid Hex UUID prefix: c1000000-...)
INSERT INTO public.cinemas (id, name, city, address, phone, status)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'CINENOVA Landmark Sài Gòn',
    'Hồ Chí Minh',
    'Tầng 5, Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
    '1900 6868',
    'active'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'CINENOVA Tây Hồ Hà Nội',
    'Hà Nội',
    'Tầng 4, Lotte Mall Tây Hồ, 272 Võ Chí Công, Phú Thượng, Tây Hồ, Hà Nội',
    '1900 8686',
    'active'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'CINENOVA Sông Hàn Đà Nẵng',
    'Đà Nẵng',
    'Tầng 3, Indochina Riverside, 74 Bạch Đằng, Hải Châu, Đà Nẵng',
    '1900 5656',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. SEED ROOMS (Valid Hex UUID prefix: b1000000-...)
INSERT INTO public.rooms (id, cinema_id, name, room_type, capacity, status)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'IMAX Laser Hall 1',
    'imax_laser',
    96,
    'active'
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Cinema Hall 2 (Dolby Atmos)',
    'standard',
    96,
    'active'
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'Phòng Chiếu 1 Deluxe',
    'deluxe',
    96,
    'active'
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000003',
    'Hall 3 Standard',
    'standard',
    96,
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. SEED SEATS (Exactly 96 seats per room: Rows A-H, Cols 1-12)
-- Row A-C (36 seats): regular
-- Row D-G (48 seats): vip
-- Row H   (12 seats): couple
-- Total: 36 + 48 + 12 = 96 seats per room x 4 rooms = 384 seats
DO $$
DECLARE
    r_id UUID;
    row_char CHAR(1);
    c_num INT;
    s_type TEXT;
    rooms_list UUID[] := ARRAY[
        'b1000000-0000-0000-0000-000000000001'::UUID,
        'b1000000-0000-0000-0000-000000000002'::UUID,
        'b1000000-0000-0000-0000-000000000003'::UUID,
        'b1000000-0000-0000-0000-000000000004'::UUID
    ];
BEGIN
    FOREACH r_id IN ARRAY rooms_list
    LOOP
        FOREACH row_char IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        LOOP
            FOR c_num IN 1..12 LOOP
                IF row_char IN ('D', 'E', 'F', 'G') THEN
                    s_type := 'vip';
                ELSIF row_char = 'H' THEN
                    s_type := 'couple';
                ELSE
                    s_type := 'regular';
                END IF;

                INSERT INTO public.seats (room_id, row_label, seat_number, seat_type, status)
                VALUES (r_id, row_char, c_num, s_type, 'active')
                ON CONFLICT (room_id, row_label, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- 4. SEED 10 MOVIES (Valid Hex UUID prefix: a1000000-...)
INSERT INTO public.movies (
  id, title, original_title, description, poster_url, backdrop_url,
  trailer_url, director, cast_members, genres, duration_minutes,
  release_date, age_rating, rating, status
)
VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Hành Tinh Cát: Phần Hai',
  'Dune: Part Two',
  'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy hoại gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu của cuộc đời và số phận của vũ trụ, anh phải ngăn chặn một tương lai đen tối mà chỉ mình anh có thể nhìn thấy.',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
  'https://www.youtube.com/watch?v=Way9Dexny3w',
  'Denis Villeneuve',
  ARRAY['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
  ARRAY['Khoa học viễn tưởng', 'Phiêu lưu', 'Hành động'],
  166,
  '2024-03-01',
  'T16',
  8.9,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Oppenheimer – Kẻ Huỷ Diệt Thế Giới',
  'Oppenheimer',
  'Câu chuyện về cuộc đời và sự giằng xé đạo đức của nhà vật lý lý thuyết J. Robert Oppenheimer, người đứng đầu Dự án Manhattan khai sinh ra quả bom nguyên tử đầu tiên trong lịch sử nhân loại.',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  'https://www.youtube.com/watch?v=uYPbbksJxIg',
  'Christopher Nolan',
  ARRAY['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
  ARRAY['Lịch sử', 'Chính kịch', 'Tiểu sử'],
  180,
  '2023-08-11',
  'T18',
  9.1,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
  'Detective Conan: The Million-dollar Pentagram',
  'Tại Hakodate, một thông điệp từ Siêu đạo chích Kid nhắm vào thanh kiếm Nhật lịch sử. Conan và Heiji Hattori cùng lao vào cuộc truy tìm bảo vật với vô vàn bí ẩn và màn đối đầu kịch tính.',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'Chika Nagaoka',
  ARRAY['Minami Takayama', 'Wakana Yamazaki', 'Rikiya Koyama', 'Kappei Yamaguchi'],
  ARRAY['Hoạt hình', 'Bí ẩn', 'Trinh thám'],
  110,
  '2024-08-02',
  'P',
  8.4,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Kẻ Trộm Mặt Trăng 4',
  'Despicable Me 4',
  'Gru chào đón thành viên mới Gru Jr. và đối mặt với kẻ thù mới Maxime Le Mal. Cùng những chú Minions siêu năng lực, gia đình Gru bước vào chuyến phiêu lưu hài hước không tưởng.',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'Chris Renaud',
  ARRAY['Steve Carell', 'Kristen Wiig', 'Will Ferrell', 'Sofia Vergara'],
  ARRAY['Hoạt hình', 'Hài hước', 'Gia đình'],
  95,
  '2024-07-05',
  'P',
  7.9,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Vùng Đất Câm Lặng: Ngày Một',
  'A Quiet Place: Day One',
  'Trải nghiệm khoảnh khắc thế giới trở nên câm lặng khi lũ sinh vật ngoài hành tinh nhạy cảm với âm thanh lần đầu tiên đổ bộ xuống thành phố New York.',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'Michael Sarnoski',
  ARRAY['Lupita Nyong''o', 'Joseph Quinn', 'Alex Wolff', 'Djimon Hounsou'],
  ARRAY['Kinh dị', 'Khoa học viễn tưởng', 'Hồi hộp'],
  100,
  '2024-06-28',
  'T16',
  8.0,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Deadpool & Wolverine',
  'Deadpool & Wolverine',
  'Cơ quan Phương sai Thời gian (TVA) đưa Wade Wilson rời khỏi cuộc sống bình dị và đẩy anh vào một nhiệm vụ mang tính sinh tử cùng với chiến binh Wolverine.',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
  'https://www.youtube.com/watch?v=73_1biulkYk',
  'Shawn Levy',
  ARRAY['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
  ARRAY['Hành động', 'Hài hước', 'Viễn tưởng'],
  128,
  '2024-07-26',
  'T18',
  8.7,
  'now_showing'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Gladiator II – Võ Sĩ Giác Đấu 2',
  'Gladiator II',
  'Tiếp nối kiệt tác điện ảnh kinh điển, Lucius bước vào Đấu trường La Mã khốc liệt để giành lại vinh quang cho Rome và báo thù cho gia tộc.',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'Ridley Scott',
  ARRAY['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
  ARRAY['Hành động', 'Sử thi', 'Chính kịch'],
  148,
  '2026-11-15',
  'T18',
  8.5,
  'coming_soon'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Moana 2 – Hành Trình Của Moana 2',
  'Moana 2',
  'Nhận được tiếng gọi từ tổ tiên, Moana cùng Maui dấn thân vào hành trình mạo hiểm đến những vùng biển xa xôi chưa từng được khám phá của Châu Đại Dương.',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'David Derrick Jr.',
  ARRAY['Auliʻi Cravalho', 'Dwayne Johnson', 'Alan Tudyk'],
  ARRAY['Hoạt hình', 'Phiêu lưu', 'Âm nhạc'],
  100,
  '2026-11-29',
  'P',
  8.3,
  'coming_soon'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Avatar 3: Tro Tàn & Lửa',
  'Avatar: Fire and Ash',
  'Chương tiếp theo trong thiên sử thi Pandora, đưa khán giả gặp gỡ Tộc Người Tro Tàn sống gần núi lửa với tính cách hung bạo và quan điểm hoàn toàn khác biệt.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'James Cameron',
  ARRAY['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver', 'Stephen Lang'],
  ARRAY['Khoa học viễn tưởng', 'Phiêu lưu', 'Hành động'],
  190,
  '2026-12-19',
  'T13',
  9.3,
  'coming_soon'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Interstellar – Hố Đen Tử Thần (IMAX)',
  'Interstellar (10th Anniversary IMAX Re-Release)',
  'Khi Trái Đất không còn là nơi an toàn cho sự sống của con người, một nhóm nhà thám hiểm dũng cảm thực hiện sứ mệnh bay xuyên qua lỗ sâu để tìm kiếm ngôi nhà mới.',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
  NULL,
  'Christopher Nolan',
  ARRAY['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
  ARRAY['Khoa học viễn tưởng', 'Chính kịch', 'Bí ẩn'],
  169,
  '2024-09-27',
  'T13',
  9.2,
  'now_showing'
)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SHOWTIMES (Valid Hex UUID prefix: e1000000-...)
-- Note on Vietnam Timezone:
-- Uses ((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) to strictly obtain
-- the local Vietnam date regardless of server session timezone (e.g. UTC).
-- All showtimes per room are strictly non-overlapping to satisfy 'no_overlapping_showtimes'.
-- Showtimes are scheduled for tomorrow and day-after-tomorrow so that every showtime
-- is guaranteed to be in the future and open for booking whenever this seed is executed.
INSERT INTO public.showtimes (
  id, movie_id, room_id, starts_at, ends_at, format, price_regular, price_vip, status
)
VALUES
-- Room 1: IMAX Laser Hall 1 (Landmark Sài Gòn) - TOMORROW
(
  'e1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001', -- Dune 2 (166m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 10 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 12 hours 46 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  140000,
  180000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000010', -- Interstellar IMAX (169m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 14 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 16 hours 49 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  160000,
  200000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001', -- Dune 2 (166m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 18 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 20 hours 46 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  160000,
  200000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000006', -- Deadpool & Wolverine (128m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 21 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 23 hours 38 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  150000,
  190000,
  'scheduled'
),

-- Room 1: IMAX Laser Hall 1 (Landmark Sài Gòn) - DAY AFTER TOMORROW
(
  'e1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000010', -- Interstellar IMAX (169m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 14 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 16 hours 49 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  160000,
  200000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000001', -- Dune 2 (166m)
  'b1000000-0000-0000-0000-000000000001',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 19 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 21 hours 46 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  'IMAX Laser',
  160000,
  200000,
  'scheduled'
),

-- Room 2: Hall 2 Dolby Atmos (Landmark Sài Gòn) - TOMORROW
(
  'e1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000003', -- Conan (110m)
  'b1000000-0000-0000-0000-000000000002',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 13 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 15 hours 20 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  95000,
  125000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000002', -- Oppenheimer (180m)
  'b1000000-0000-0000-0000-000000000002',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 16 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 19 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  110000,
  140000,
  'scheduled'
),

-- Room 2: Hall 2 Dolby Atmos (Landmark Sài Gòn) - DAY AFTER TOMORROW
(
  'e1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000002', -- Oppenheimer (180m)
  'b1000000-0000-0000-0000-000000000002',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 18 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '2 days 21 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  110000,
  140000,
  'scheduled'
),

-- Room 3: Deluxe Hall 1 (Tây Hồ Hà Nội) - TOMORROW
(
  'e1000000-0000-0000-0000-000000000010',
  'a1000000-0000-0000-0000-000000000004', -- Despicable Me 4 (95m)
  'b1000000-0000-0000-0000-000000000003',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 10 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 12 hours 05 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  90000,
  120000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000005', -- A Quiet Place (100m)
  'b1000000-0000-0000-0000-000000000003',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 14 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 16 hours 10 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  100000,
  130000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000006', -- Deadpool & Wolverine (128m)
  'b1000000-0000-0000-0000-000000000003',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 19 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 21 hours 38 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  105000,
  135000,
  'scheduled'
),

-- Room 4: Standard Hall 3 (Sông Hàn Đà Nẵng) - TOMORROW
(
  'e1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-000000000003', -- Conan (110m)
  'b1000000-0000-0000-0000-000000000004',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 15 hours') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 16 hours 50 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  90000,
  120000,
  'scheduled'
),
(
  'e1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-000000000001', -- Dune 2 (166m)
  'b1000000-0000-0000-0000-000000000004',
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 18 hours 30 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  (((pg_catalog.now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + INTERVAL '1 day 21 hours 16 minutes') AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  '2D Digital',
  100000,
  130000,
  'scheduled'
)
ON CONFLICT (id) DO NOTHING;
