-- ==============================================================================
-- CINENOVA – Hướng Dẫn Cấp Quyền Admin An Toàn (Safe Admin Elevation)
-- ==============================================================================
-- BƯỚC 1: Người dùng đăng ký tài khoản bình thường qua giao diện /register
-- BƯỚC 2: Mở Supabase Dashboard -> Authentication -> Users, tìm email và sao chép User UID (UUID).
-- BƯỚC 3: Mở Supabase Dashboard -> SQL Editor, thay thế <USER_UUID> và chạy lệnh dưới đây:

UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE id = '<USER_UUID>';

-- BƯỚC 4: Kiểm tra lại role đã được cập nhật thành công:
SELECT id, full_name, phone, role, created_at
FROM public.profiles
WHERE role = 'admin';
