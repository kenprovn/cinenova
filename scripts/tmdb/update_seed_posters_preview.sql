-- ==============================================================================
-- CINENOVA – PREVIEW SQL: CẬP NHẬT POSTER & BACKDROP CHÍNH THỨC TỪ TMDB
-- Áp dụng cho 10 phim hạt giống ban đầu (seed movies)
-- LƯU Ý: Đây là script PREVIEW. KHÔNG tự động thực thi trên Production.
-- Người dùng có thể review và chạy trên Supabase SQL Editor khi mong muốn.
-- ==============================================================================

-- 1. Hành Tinh Cát: Phần Hai (Dune: Part Two - TMDB: 693134)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/8QdnKQyZDlN6rBSrfU1V5PctfUu.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- 2. Oppenheimer (TMDB: 872585)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/ixLH2iM9at8BbuLr5wQWnCfwhJO.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000002';

-- 3. Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô (TMDB: 1209217)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/AlSEw3akrBZRK9w68gcFQpHHpy3.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/4TMkOnI6rCYxqD059aeeQSBv5mc.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000003';

-- 4. Kẻ Trộm Mặt Trăng 4 (Despicable Me 4 - TMDB: 519182)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/lYr8DyAz9HeQX4ZFOhYWEYwKe2h.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/twsxsfao6ZOVvT8LfudH603MMi6.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000004';

-- 5. Vùng Đất Câm Lặng: Ngày Một (A Quiet Place: Day One - TMDB: 762441)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/bi1YGU4vvUvoXvzbN0E7RRSNlMQ.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000005';

-- 6. Deadpool & Wolverine (TMDB: 533535)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/lfY2CfmxyN9OvxmFuap6aejViJn.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000006';

-- 7. Mai (TMDB: 1210973)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/2nF8xD200rcDawuCg5ObxxqA2fC.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/zZ6nRdNQNxRnZ1LQ2ttPBZl9AXV.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000007';

-- 8. Lật Mặt 7: Một Điều Ước (TMDB: 1258626)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/aSPg7viRKZUp6py0VLVTv6mo3GN.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/1K7pHhCZprfDXB7LkCquIK62yCb.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000008';

-- 9. Godzilla x Kong: Đế Chế Mới (TMDB: 823464)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/gvLG3Fnznkxl4SmYfcK8gUuqxM8.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000009';

-- 10. Hố Đen Tử Thần (Interstellar - TMDB: 157336)
UPDATE public.movies
SET 
  poster_url = 'https://image.tmdb.org/t/p/w780/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
  updated_at = NOW()
WHERE id = 'a1000000-0000-0000-0000-000000000010';

