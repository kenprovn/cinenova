# CINENOVA – Cinema Booking & Management System

CINENOVA là hệ thống quản lý và đặt vé xem phim hiện đại, cung cấp giải pháp toàn diện cho cả khách hàng đặt vé trực tuyến và đội ngũ vận hành rạp chiếu phim.

---

## 🎯 Giới thiệu dự án

Dự án CINENOVA được thiết kế nhằm nâng cao trải nghiệm đặt vé của người dùng với giao diện mượt mà, trực quan, đồng thời hỗ trợ quản trị viên quản lý phòng chiếu, lịch chiếu, phim, giá vé và doanh thu một cách hiệu quả và theo thời gian thực.

### ✨ Mục tiêu & Tính năng chính dự kiến:
- **Khách hàng (Client Portal):**
  - Khám phá danh sách phim đang chiếu, sắp chiếu và xem trailer.
  - Chọn rạp, suất chiếu, phòng chiếu theo ngày và giờ linh hoạt.
  - Sơ đồ ghế tương tác trực quan (ghế thường, VIP, đôi, trạng thái ghế theo thời gian thực).
  - Đặt combo bắp nước đi kèm vé.
  - Thanh toán trực tuyến an toàn & nhận mã vé điện tử / QR Code.
  - Quản lý lịch sử đặt vé và thông tin cá nhân.

- **Quản trị (Admin / Manager Portal):**
  - Quản lý danh mục phim, thể loại, đạo diễn, diễn viên, thời lượng.
  - Quản lý sơ đồ cụm rạp, phòng chiếu và bố cục ghế.
  - Điều phối và xếp lịch chiếu thông minh, tránh trùng giờ.
  - Quản lý giá vé linh hoạt theo khung giờ, loại ghế, ngày thường/cuối tuần/ngày lễ.
  - Thống kê doanh thu, tỷ lệ lấp đầy ghế và báo cáo phân tích thời gian thực.
  - Quản lý nhân viên và phân quyền hệ thống (Role-based Access Control).

---

## 🛠️ Công nghệ cốt lõi dự kiến (Tech Stack)

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI:** Tailwind CSS, Lucide Icons
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security, Realtime, Storage)
- **Quản lý mã nguồn & CI/CD:** Git & GitHub

---

## 📁 Cấu trúc thư mục (Dự kiến)

```text
CINENOVA/
├── public/              # Static assets
├── src/
│   ├── assets/          # Hình ảnh, icons, styles
│   ├── components/      # UI components tái sử dụng
│   ├── features/        # Các module chức năng (booking, movie, admin,...)
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Layout cho Client và Admin
│   ├── lib/             # Supabase client & cấu hình thư viện bên thứ 3
│   ├── routes/          # Cấu hình định tuyến
│   ├── types/           # Định nghĩa TypeScript interface / type
│   └── utils/           # Helper functions
├── .gitignore
└── README.md
```

---

## 🚀 Khởi chạy dự án

*(Thông tin chi tiết về cài đặt môi trường và lệnh chạy sẽ được cập nhật khi hoàn thiện source code ban đầu)*

---

## 📄 Bản quyền & Tác giả

- **Phát triển bởi:** [kenprovn](https://github.com/kenprovn)
- **Dự án:** CINENOVA
