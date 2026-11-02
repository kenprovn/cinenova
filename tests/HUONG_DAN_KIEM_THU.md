# CINENOVA Phase 3 – Bộ kiểm thử PostgreSQL thực tế

**Bộ file này là mã kiểm thử, KHÔNG phải migration.** Được viết theo schema `20261102000001_initial_schema.sql` và các RPC trong migration 3/4 phiên bản bạn đã gửi (ngày 02/11/2026). **Chưa kết nối, chưa chạy thử trên Supabase Cloud; không được coi là runtime PASS.**

## 1. File nào dùng để làm gì?

| File | Mục đích | Có ghi dữ liệu lâu dài? |
|---|---|---|
| `postgres_permissions_test.sql` | Phân quyền anon / Customer A / Customer B / Admin; phát hiện PASS giả; fixture tạo và `ROLLBACK` | **Không**, nếu chạy trọn trong 1 transaction |
| `concurrency_SETUP_TEST_DB_ONLY.sql` | Tạo phim, rạp, phòng, suất chiếu, D7/D8 **riêng biệt** trong test project | **Có**, cần xác nhận guard |
| `concurrency_A_HOLD.psql`, `concurrency_B_HOLD.psql` | Hai kết nối thực sự tranh chấp D7 | A giữ ghế nếu `COMMIT` |
| `concurrency_A_TWO_SEATS.psql`, `concurrency_B_TWO_SEATS.psql` | Hai kết nối tranh chấp D7+D8 với thứ tự đảo nhau | A giữ ghế nếu `COMMIT` |
| `concurrency_A_PAYMENT.psql`, `concurrency_B_HOLD.psql` | A thanh toán demo D7 trong transaction chưa commit, B cố giữ D7 | **Có**, thanh toán DEMO test |
| `concurrency_VERIFY.sql`, `concurrency_VERIFY_PAYMENT.sql` | Đọc database xác minh trạng thái | Không |
| `idempotency_ROLLBACK.psql` | Tạo booking → retry cùng key → kiểm tra payload khác (cùng transaction, rollback) | Không |
| `concurrency_RESET_HOLDS_TEST_DB_ONLY.sql` | Dọn hold trong fixture để chạy lại | **Có**, chỉ test |
| `concurrency_CLEANUP_TEST_DB_ONLY.sql` | Xóa mọi bản ghi fixture theo ID và dấu hiệu đã biết | **Có**, chỉ test |

### Trước khi chạy

1. **Tạo một Supabase project TEST riêng biệt**, áp dụng migration 1 → 5 và seed phù hợp; không thử fixture ghi dữ liệu trên project CINENOVA bạn đang dùng.
2. Đăng ký **hai tài khoản Customer thật bằng Supabase Auth** và có ít nhất một tài khoản Admin; không INSERT trực tiếp vào `auth.users`.
3. Không đặt mật khẩu, access token, JWT hay connection string chứa thông tin bí mật vào các file này hoặc Git.
4. `postgres_permissions_test.sql` có thể chạy **một lần** trong SQL Editor với kết nối đủ quyền, sau khi migration 3/4 được áp dụng. Mọi test fixture nằm trong `BEGIN … ROLLBACK`. Quan sát các `NOTICE` và lỗi SQL. Nếu có lỗi `FAIL`, kết quả là FAIL; không được đếm các `NOTICE` trước lỗi là toàn bộ test PASS.
5. Kiểm thử tranh chấp yêu cầu **hai phiên PostgreSQL kết nối độc lập và giữ kết nối mở**, khuyến nghị `psql` hoặc DBeaver (autocommit OFF). **Hai tab Supabase SQL Editor không được đảm bảo là hai session sống liên tục**; không dùng để khẳng định concurrency đã được kiểm thử.

## 2. Kiểm thử phân quyền (ROLLBACK)

Trên **Supabase TEST project** → SQL Editor, mở `postgres_permissions_test.sql`, chạy cả file trong **một lần Run**. File tự tìm hai profile `customer` và một profile `admin` thực tế, tạo dữ liệu fixture (movie/showtime, 2 ghế, 2 booking, 1 hold, 1 ghế bán, 1 payment + ticket) và chạy từng vai trò bằng `SET LOCAL ROLE`, `request.jwt.claim.sub`.

**Kết quả mong đợi:** Các `PASS ...` hiển thị, cuối script thực hiện `ROLLBACK`. Nếu xuất hiện `FAIL ...` hoặc các lỗi khác, **không đạt**. Lưu ý kiểm thử `SET ROLE` chỉ là mô phỏng ngữ cảnh ở database; **nên bổ sung kiểm thử JWT đăng nhập thật bằng Supabase SDK** cho kết quả bảo mật toàn diện.

## 3. Kiểm thử đồng thời với psql (TEST project riêng)

Mở **ba** phiên kết nối `psql` có quyền test/SQL Editor tương đương: `Admin/Test Setup`, `Customer A session`, `Customer B session`. Không khởi chạy lệnh viết fixture ở project đang dùng. Trong session Setup:

```sql
SET cinenova_test.allow_write = 'YES_THIS_IS_A_DISPOSABLE_TEST_PROJECT';
```

Sau đó dùng lệnh meta-command `\i /duong-dan/concurrency_SETUP_TEST_DB_ONLY.sql` để tạo fixture. Nếu lệnh bị từ chối, **không bỏ kiểm tra guard**: kiểm tra đang dùng đúng test project.

Các ID fixture đặt trước, không nhầm `cinema_id` với `room_id`:

- Showtime test: `f3a00000-0000-4000-8000-000000000004`
- Seat D7: `f3a00000-0000-4000-8000-000000000007`
- Seat D8: `f3a00000-0000-4000-8000-000000000008`
- Room test: `f3a00000-0000-4000-8000-000000000003`

Lấy UUID **thật** của hai customer trong test project qua query quản trị:

```sql
SELECT id, role FROM public.profiles WHERE role = 'customer' ORDER BY id;
```

Trong psql A:

```text
\set customer_a 'UUID_THAT_CUA_CUSTOMER_A'
\i /duong-dan/concurrency_A_HOLD.psql
```

File A mở `BEGIN`, giữ D7 và **để transaction chưa COMMIT**. Không thoát khỏi psql.

Trong psql B:

```text
\set customer_b 'UUID_THAT_CUA_CUSTOMER_B'
\i /duong-dan/concurrency_B_HOLD.psql
```

B phải **chờ row lock**. Trong vòng 15 giây, quay lại psql A và gõ `COMMIT;`. Sau đó B phải bị **từ chối giữ ghế**. Gõ `ROLLBACK;` ở B để dọn transaction lỗi. Chạy `concurrency_VERIFY.sql` trong session Setup, kiểm tra `holder_user_id` đúng A, `still_active = true`, không có `sold_booking_id`.

**Không được coi `lock timeout (55P03)` là PASS**: đó là bài test chưa hoàn tất. Nếu B được phép giữ thành công, FAIL. Nếu A hết hạn (5 phút) trước khi xác minh, chạy lại từ đầu.

### Hai ghế thứ tự ngược

Tại session Setup đã đặt guard, chạy `concurrency_RESET_HOLDS_TEST_DB_ONLY.sql`. Sau đó dùng `concurrency_A_TWO_SEATS.psql` tại A và `concurrency_B_TWO_SEATS.psql` tại B, lặp lại quy trình để A commit trong khi B đang chờ. Kiểm tra cả D7 và D8 đều do A giữ, B không có ghế nào.

### Thanh toán A đối đầu giữ ghế B

Reset holds trên fixture; xác nhận D7 chưa có bản ghi trong `showtime_seats`. Ở A chạy `concurrency_A_PAYMENT.psql` (giữ ghế → tạo booking → thanh toán demo trong **transaction chưa commit**). Ở B chạy lại `concurrency_B_HOLD.psql`; sau khi B chờ, A gõ `COMMIT;`, B phải bị từ chối và `ROLLBACK;`. Chạy `concurrency_VERIFY_PAYMENT.sql`: trường `database_invariants_pass` phải là `true`, **và B đã thực sự bị từ chối**. Test này tạo payment và ticket demo **chỉ trong test project**, cần cleanup sau.

### Idempotency

Trước bài test thanh toán (khi D7 chưa bán), reset holds, ở A chạy `idempotency_ROLLBACK.psql`. File tạo 1 booking, retry cùng key, kiểm tra trả về ID cũ và từ chối thay payload; cuối cùng `ROLLBACK`. Đây là test tuần tự, **chưa phải** bài test hai INSERT cùng key đồng thời.

### Ghế hết hạn / Check-in / hai booking cùng key đồng thời

**Chưa có test runtime tự động đầy đủ** cho các tình huống này trong gói hiện tại. Có thể bổ sung kịch bản sau khi ba bài ở trên thành công. Đừng báo PASS cho chúng khi chưa thực thi.

## 4. Dọn dẹp

Chỉ trong session Setup trên **test project**, vẫn giữ config guard. Chạy:

```text
\i /duong-dan/concurrency_CLEANUP_TEST_DB_ONLY.sql
```

File chỉ xóa dữ liệu liên kết tới fixture có UUID và marker `[CN-TEST-ONLY]` đã xác minh, theo thứ tự khóa ngoại. **Không tạo/xóa tài khoản Auth**, không chạm phim/suất chiếu gốc. Nếu lệnh lỗi, giữ nguyên trạng thái lỗi và kiểm tra thủ công; **không chạy DELETE rộng**.

## 5. Điều chưa kiểm chứng

Các file đã được rà soát tĩnh và tạo thành công trong cuộc trò chuyện này; **không có kết nối tới Supabase / PostgreSQL thực tế để thực thi**. Chưa thể tuyên bố RLS, RPC, deadlock hay payment đã PASS runtime. Báo cáo lỗi theo SQLSTATE và thông báo nguyên văn; các lỗi ngoài dự kiến như FK (23503), cú pháp (42601) hoặc lock timeout (55P03) đều **không được coi là PASS**.
