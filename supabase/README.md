# HƯỚNG DẪN TRIỂN KHAI CƠ SỞ DỮ LIỆU SUPABASE – CINENOVA (PHASE 2)

Hệ thống cơ sở dữ liệu PostgreSQL của CINENOVA được thiết kế theo chuẩn bảo mật cao nhất, bao gồm 11 bảng quan hệ, ràng buộc chống trùng lịch chiếu bằng `btree_gist`, trigger tự động tạo Profile khi người dùng đăng ký, và Row Level Security (RLS) với GRANT tường minh.

---

## 📁 Danh sách tệp SQL

1. `supabase/migrations/20261102000001_initial_schema.sql`:
   - Kích hoạt extensions `uuid-ossp` và `btree_gist`.
   - Tạo các bảng: `profiles`, `movies`, `cinemas`, `rooms`, `seats`, `showtimes`, `bookings`, `booking_seats`, `seat_holds`, `payments`, `tickets`.
   - Ràng buộc loại trừ chống trùng suất chiếu trong cùng phòng: `no_overlapping_showtimes`.
   - Trigger `on_auth_user_created` trên `auth.users` tự động tạo profile với role mặc định là `customer`.

2. `supabase/migrations/20261102000002_rls_and_policies.sql`:
   - Cấp quyền truy cập tường minh `GRANT USAGE ON SCHEMA public` và `GRANT SELECT` (do tùy chọn "Automatically expose new tables" trong Supabase đang TẮT).
   - Hàm `public.is_admin()` với `SECURITY DEFINER` để kiểm tra quyền admin an toàn.
   - Kích hoạt Row Level Security (RLS) trên tất cả các bảng.
   - Chính sách phân quyền chi tiết cho khách (anon), thành viên (authenticated) và quản trị viên (admin).

3. `supabase/seed.sql`:
   - Dữ liệu khởi tạo: 10 phim bom tấn, 3 cụm rạp, 4 phòng chiếu, 384 ghế ngồi chi tiết và các suất chiếu tương lai.

4. `supabase/grant_admin.sql`:
   - Câu lệnh SQL an toàn để chủ dự án nâng cấp một tài khoản người dùng thành Admin sau khi đăng ký.

---

## 🚀 Cách thực thi trên Supabase Dashboard (Khuyên dùng)

Nếu bạn không sử dụng Supabase CLI cục bộ, bạn có thể chạy trực tiếp qua **Supabase SQL Editor**:

### Bước 1: Mở Supabase SQL Editor
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án **cinenova** (Khu vực Sydney).
3. Nhấp vào mục **SQL Editor** ở thanh menu bên trái.

### Bước 2: Chạy Migration 1 – Khởi tạo cấu trúc bảng
1. Mở tệp `supabase/migrations/20261102000001_initial_schema.sql` trong dự án.
2. Sao chép toàn bộ nội dung và dán vào tab mới trong SQL Editor.
3. Bấm nút **Run** (Ctrl + Enter).
4. Kiểm tra thông báo `Success. No rows returned`.

### Bước 3: Chạy Migration 2 – Cấu hình RLS & Phân quyền
1. Mở tệp `supabase/migrations/20261102000002_rls_and_policies.sql`.
2. Sao chép toàn bộ nội dung và dán vào SQL Editor.
3. Bấm nút **Run**.
4. Kiểm tra thông báo `Success. No rows returned`.

### Bước 4: Chạy Seed Data (Dữ liệu mẫu)
1. Mở tệp `supabase/seed.sql`.
2. Sao chép và dán vào SQL Editor.
3. Bấm nút **Run**.
4. Các bảng `cinemas`, `rooms`, `seats`, `movies`, `showtimes` sẽ được điền đầy đủ dữ liệu chuẩn.

---

## 👑 Hướng dẫn cấp quyền Admin an toàn

Theo nguyên tắc an toàn, hệ thống **không tự động cấp quyền Admin** cho người dùng đăng ký qua web:

1. Đăng ký tài khoản bình thường tại trang `/register` của website (ví dụ: `admin@cinenova.vn`).
2. Mở Supabase Dashboard -> **Authentication** -> **Users**.
3. Tìm tài khoản vừa đăng ký, bấm sao chép **User UID** (dạng UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
4. Mở **SQL Editor**, chạy câu lệnh:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', updated_at = NOW()
   WHERE id = '<DÁN_USER_UID_VÀO_ĐÂY>';
   ```
5. Đăng xuất và đăng nhập lại trên website, bạn sẽ thấy nút **Admin Portal** và được cấp toàn quyền truy cập `/admin`.

