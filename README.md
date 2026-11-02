# CINENOVA – Cinema Booking & Management System

CINENOVA là hệ thống quản lý rạp chiếu phim và đặt vé xem phim trực tuyến hiện đại, mang phong cách thiết kế **Premium Cinematic (Dark Theme)** với tông màu đỏ thẫm `#B91C32`, vàng gold `#E5B96B` và nền tối `#0B0D14`.

---

## 🎯 Giới thiệu dự án

Dự án CINENOVA cung cấp giải pháp toàn diện cho:
- **Khách hàng (Client Portal):** Khám phá phim, xem trailer, chọn rạp, chọn suất chiếu, chọn vị trí ghế trực quan và thực hiện thanh toán vé xem phim mô phỏng.
- **Quản trị viên (Admin Portal):** Dashboard thống kê doanh thu, lưu lượng bán vé, tỷ lệ lấp đầy ghế theo thời gian thực và quản lý phim, suất chiếu, đơn đặt vé.

---

## 🛠️ Công nghệ cốt lõi (Tech Stack)

### Frontend (Phase 1 – Hoàn thành)
- **Framework & Build Tool:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/)
- **Định tuyến:** [React Router v6](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icon System:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API (`BookingContext` có lưu draft phiên làm việc)
- **Kiểm soát chất lượng:** TypeScript strict mode, build production không có lỗi.

### Backend & Database (Phase 2 – Dự kiến)
- [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security, Realtime seat sync, Storage cho poster/trailer)

---

## 📁 Cấu trúc thư mục thực tế

```text
CINENOVA/
├── public/
│   └── favicon.svg                  # Favicon thương hiệu CINENOVA
├── src/
│   ├── app/
│   │   └── App.tsx                  # Root App, cấu hình React Router & Providers
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.tsx            # Badge phân loại độ tuổi (P, K, T13, T16, T18)
│   │   │   ├── ClientLayout.tsx     # Layout khách hàng (DemoBanner + Navbar + Footer)
│   │   │   ├── DemoBanner.tsx       # Thanh thông báo môi trường demo Phase 1
│   │   │   ├── Footer.tsx           # Footer rạp chiếu phim chuyên nghiệp
│   │   │   ├── Navbar.tsx           # Thanh điều hướng sticky với mobile drawer
│   │   │   ├── NotFoundPage.tsx     # Trang lỗi 404
│   │   │   └── ScrollToTop.tsx      # Tự động cuộn lên đầu khi chuyển route
│   │   └── movies/
│   │       └── MovieCard.tsx        # Card phim với hover effects, badges, fallback ảnh
│   ├── data/
│   │   └── mockData.ts              # Dữ liệu mẫu 10 phim, 3 cụm rạp, suất chiếu & thống kê
│   ├── features/
│   │   ├── admin/
│   │   │   ├── AdminBookings.tsx    # Bảng đơn vé đặt trực tuyến
│   │   │   ├── AdminLayout.tsx      # Sidebar & header layout quản trị
│   │   │   ├── AdminMovies.tsx      # Danh mục quản lý phim & modal thêm phim
│   │   │   ├── AdminOverview.tsx    # KPI metrics, biểu đồ 7 ngày & top phim
│   │   │   ├── AdminPage.tsx        # Trang chủ khu vực admin
│   │   │   └── AdminShowtimes.tsx   # Danh sách và điều phối suất chiếu
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx        # Giao diện đăng nhập (validation form)
│   │   │   └── RegisterPage.tsx     # Giao diện đăng ký (validation form)
│   │   ├── booking/
│   │   │   ├── BookingContext.tsx   # Context quản lý state phim, suất chiếu, ghế, khách hàng
│   │   │   ├── CheckoutDemoPage.tsx # Thanh toán demo & xuất vé điện tử e-ticket
│   │   │   ├── SeatSelectionPage.tsx# Sơ đồ phòng chiếu, ghế thường/VIP/đôi, tính tiền
│   │   │   └── ShowtimeSelectPage.tsx# Lọc suất chiếu theo cụm rạp và ngày
│   │   └── movies/
│   │       ├── HomePage.tsx         # Trang chủ, hero banner bom tấn, đặt vé nhanh
│   │       ├── MovieDetailsPage.tsx # Chi tiết phim, trailer modal, chọn suất chiếu
│   │       └── MoviesPage.tsx       # Tìm kiếm, lọc thể loại, lọc trạng thái phim
│   ├── lib/
│   │   └── utils.ts                 # Helper hàm cn(), format tiền tệ VND, định dạng ngày
│   ├── styles/
│   │   └── index.css                # Tailwind directives, custom scrollbar, glassmorphism
│   ├── types/
│   │   └── index.ts                 # TypeScript types/interfaces cho toàn hệ thống
│   └── main.tsx                     # Entry point React
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🚀 Khởi chạy dự án (Local Development)

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Trình duyệt sẽ tự động mở hoặc bạn có thể truy cập: `http://localhost:3000`

### 3. Kiểm tra TypeScript & Build Production
```bash
npm run build
```

### 4. Xem trước bản build production
```bash
npm run preview
```

---

## 🚦 Luồng trải nghiệm người dùng trong Phase 1

1. **Trang chủ (`/`):** Hero banner bom tấn → Đặt vé nhanh → Danh sách phim đang chiếu/sắp chiếu → Trải nghiệm công nghệ rạp.
2. **Danh mục phim (`/movies`):** Tìm kiếm phim thời gian thực, lọc theo thể loại, độ tuổi, đang chiếu/sắp chiếu.
3. **Chi tiết phim (`/movies/:id`):** Xem trailer, đạo diễn, diễn viên, nội dung và chọn trực tiếp suất chiếu theo rạp/ngày.
4. **Chọn suất chiếu (`/booking/:movieId`):** Chọn cụm rạp (Landmark Sài Gòn, Tây Hồ Hà Nội, Sông Hàn Đà Nẵng) và ngày xem.
5. **Chọn ghế (`/booking/:movieId/seats`):** Sơ đồ phòng chiếu trực quan, ghế thường, VIP, ghế đôi, tính tiền tự động theo thời gian thực (tối đa 8 ghế/đơn).
6. **Thanh toán demo (`/checkout`):** Nhập thông tin người nhận vé, chọn cổng thanh toán mô phỏng (MoMo, VNPAY, Thẻ, ZaloPay), tạo vé điện tử e-ticket demo có mã QR.
7. **Khu vực Admin (`/admin`):** Dashboard tổng quan doanh thu, vé bán ra, biểu đồ 7 ngày, quản lý phim, suất chiếu và đơn đặt vé.
8. **Đăng nhập / Đăng ký (`/login`, `/register`):** Form xác thực giao diện đẹp mắt kèm cảnh báo mô phỏng Phase 1.

---

## ⚠️ Lưu ý về phạm vi Phase 1 (Frontend Prototype)

- **Trạng thái ghế:** Được mô phỏng bằng dữ liệu TypeScript, chưa có tính năng khóa ghế đồng thời giữa nhiều người dùng (sẽ làm trong Phase 2 bằng Supabase Realtime).
- **Thanh toán:** Là giao diện mô phỏng UX, hoàn toàn không kết nối cổng thanh toán thật và không trừ tiền.
- **Xác thực:** Form có kiểm tra hợp lệ phía client; chưa lưu mật khẩu hay tài khoản vào database.

---

## 📄 Bản quyền & Tác giả

- **Phát triển bởi:** [kenprovn](https://github.com/kenprovn)
- **Dự án:** CINENOVA – Cinema Booking & Management System
