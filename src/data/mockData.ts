import { Movie, Cinema, Showtime, Seat, BookingRecord, AdminStats } from '../types';

export const MOCK_MOVIES: Movie[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    title: 'Hành Tinh Cát: Phần Hai',
    originalTitle: 'Dune: Part Two',
    slug: 'dune-part-two',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8QdnKQyZDlN6rBSrfU1V5PctfUu.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    duration: 166,
    releaseDate: '2024-03-01',
    ageRating: 'T16',
    genres: ['Khoa học viễn tưởng', 'Phiêu lưu', 'Hành động'],
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    synopsis: 'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy hoại gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu của cuộc đời và số phận của vũ trụ đã được tiên tri, anh phải ngăn chặn một tương lai đen tối mà chỉ mình anh có thể nhìn thấy.',
    rating: 8.9,
    reviewCount: 3420,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    title: 'Oppenheimer – Kẻ Huỷ Diệt Thế Giới',
    originalTitle: 'Oppenheimer',
    slug: 'oppenheimer',
    posterUrl: 'https://image.tmdb.org/t/p/w780/ixLH2iM9at8BbuLr5wQWnCfwhJO.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    duration: 180,
    releaseDate: '2023-08-11',
    ageRating: 'T18',
    genres: ['Lịch sử', 'Chính kịch', 'Tiểu sử'],
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    synopsis: 'Câu chuyện về cuộc đời và sự giằng xé đạo đức của nhà vật lý lý thuyết J. Robert Oppenheimer, người đứng đầu Dự án Manhattan khai sinh ra quả bom nguyên tử đầu tiên trong lịch sử nhân loại.',
    rating: 9.1,
    reviewCount: 4890,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
    originalTitle: 'Detective Conan: The Million-dollar Pentagram',
    slug: 'detective-conan-million-dollar',
    posterUrl: 'https://image.tmdb.org/t/p/w780/AlSEw3akrBZRK9w68gcFQpHHpy3.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/4TMkOnI6rCYxqD059aeeQSBv5mc.jpg',
    duration: 110,
    releaseDate: '2024-08-02',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Bí ẩn', 'Trinh thám'],
    director: 'Chika Nagaoka',
    cast: ['Minami Takayama', 'Wakana Yamazaki', 'Rikiya Koyama', 'Kappei Yamaguchi'],
    synopsis: 'Tại Hakodate, một thông điệp từ Siêu đạo chích Kid nhắm vào thanh kiếm Nhật lịch sử. Conan và Heiji Hattori cùng lao vào cuộc truy tìm bảo vật với vô vàn bí ẩn và màn đối đầu kịch tính.',
    rating: 8.4,
    reviewCount: 1980,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    title: 'Kẻ Trộm Mặt Trăng 4',
    originalTitle: 'Despicable Me 4',
    slug: 'despicable-me-4',
    posterUrl: 'https://image.tmdb.org/t/p/w780/lYr8DyAz9HeQX4ZFOhYWEYwKe2h.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/twsxsfao6ZOVvT8LfudH603MMi6.jpg',
    duration: 95,
    releaseDate: '2024-07-05',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hài hước', 'Gia đình'],
    director: 'Chris Renaud',
    cast: ['Steve Carell', 'Kristen Wiig', 'Will Ferrell', 'Sofia Vergara'],
    synopsis: 'Gru chào đón thành viên mới Gru Jr. và đối mặt với kẻ thù mới Maxime Le Mal. Cùng những chú Minions siêu năng lực, gia đình Gru bước vào chuyến phiêu lưu hài hước không tưởng.',
    rating: 7.9,
    reviewCount: 1450,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    title: 'Vùng Đất Câm Lặng: Ngày Một',
    originalTitle: 'A Quiet Place: Day One',
    slug: 'a-quiet-place-day-one',
    posterUrl: 'https://image.tmdb.org/t/p/w780/bi1YGU4vvUvoXvzbN0E7RRSNlMQ.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg',
    duration: 100,
    releaseDate: '2024-06-28',
    ageRating: 'T16',
    genres: ['Kinh dị', 'Khoa học viễn tưởng', 'Hồi hộp'],
    director: 'Michael Sarnoski',
    cast: ['Lupita Nyong\'o', 'Joseph Quinn', 'Alex Wolff', 'Djimon Hounsou'],
    synopsis: 'Trải nghiệm khoảnh khắc thế giới trở nên câm lặng khi lũ sinh vật ngoài hành tinh nhạy cảm với âm thanh lần đầu tiên đổ bộ xuống thành phố sầm uất New York.',
    rating: 8.0,
    reviewCount: 2120,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000006',
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    slug: 'deadpool-and-wolverine',
    posterUrl: 'https://image.tmdb.org/t/p/w780/lfY2CfmxyN9OvxmFuap6aejViJn.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    duration: 128,
    releaseDate: '2024-07-26',
    ageRating: 'T18',
    genres: ['Hành động', 'Hài hước', 'Viễn tưởng'],
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
    synopsis: 'Cơ quan Phương sai Thời gian (TVA) đưa Wade Wilson rời khỏi cuộc sống bình dị và đẩy anh vào một nhiệm vụ mang tính sinh tử cùng với chiến binh Wolverine.',
    rating: 8.7,
    reviewCount: 5210,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: true,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000007',
    title: 'Mai',
    originalTitle: 'Mai',
    slug: 'mai',
    posterUrl: 'https://image.tmdb.org/t/p/w780/2nF8xD200rcDawuCg5ObxxqA2fC.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/zZ6nRdNQNxRnZ1LQ2ttPBZl9AXV.jpg',
    duration: 131,
    releaseDate: '2024-02-10',
    ageRating: 'T18',
    genres: ['Tâm lý', 'Tình cảm', 'Hài hước'],
    director: 'Trấn Thành',
    cast: ['Phương Anh Đào', 'Tuấn Trần', 'Trấn Thành', 'Hồng Đào'],
    synopsis: 'Mai là một người phụ nữ gần 40 tuổi làm nghề massage. Cô luôn đối mặt với những định kiến xã hội khắt khe cho đến khi gặp Dương - một chàng trai trẻ tuổi, phóng khoáng và đem lòng yêu cô tha thiết.',
    rating: 8.6,
    reviewCount: 12400,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000008',
    title: 'Lật Mặt 7: Một Điều Ước',
    originalTitle: 'Face Off 7: One Wish',
    slug: 'lat-mat-7',
    posterUrl: 'https://image.tmdb.org/t/p/w780/aSPg7viRKZUp6py0VLVTv6mo3GN.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/1K7pHhCZprfDXB7LkCquIK62yCb.jpg',
    duration: 138,
    releaseDate: '2024-04-26',
    ageRating: 'K',
    genres: ['Gia đình', 'Chính kịch', 'Tình cảm'],
    director: 'Lý Hải',
    cast: ['Thanh Hiền', 'Trương Minh Cường', 'Đinh Y Nhung', 'Quách Ngọc Tuyên'],
    synopsis: 'Câu chuyện cảm động về bà Hai 73 tuổi sống cô đơn tại ngôi nhà miền sơn cước. Khi bà gặp tai nạn gãy chân, 5 người con dù thành đạt ở các thành phố lớn nhưng ai cũng có lý do riêng để đùn đẩy trách nhiệm chăm sóc mẹ.',
    rating: 8.8,
    reviewCount: 9500,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000009',
    title: 'Godzilla x Kong: Đế Chế Mới',
    originalTitle: 'Godzilla x Kong: The New Empire',
    slug: 'godzilla-x-kong',
    posterUrl: 'https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/gvLG3Fnznkxl4SmYfcK8gUuqxM8.jpg',
    duration: 115,
    releaseDate: '2024-03-29',
    ageRating: 'T13',
    genres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    director: 'Adam Wingard',
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens'],
    synopsis: 'Godzilla và Kong phải gạt bỏ mối thù truyền kiếp để hợp lực chống lại một mối đe dọa khổng lồ chưa từng được khám phá ẩn sâu trong Trái Đất Rỗng, đe dọa sự tồn vong của cả nhân loại.',
    rating: 8.2,
    reviewCount: 3800,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  },
  {
    id: 'a1000000-0000-0000-0000-000000000010',
    title: 'Hố Đen Tử Thần (Interstellar)',
    originalTitle: 'Interstellar (10th Anniversary IMAX Re-Release)',
    slug: 'interstellar-imax',
    posterUrl: 'https://image.tmdb.org/t/p/w780/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    duration: 169,
    releaseDate: '2024-09-27',
    ageRating: 'T13',
    genres: ['Khoa học viễn tưởng', 'Chính kịch', 'Bí ẩn'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    synopsis: 'Khi Trái Đất không còn là nơi an toàn cho sự sống của con người, một nhóm nhà thám hiểm dũng cảm thực hiện sứ mệnh lịch sử bay xuyên qua lỗ sâu để tìm kiếm ngôi nhà mới cho nhân loại.',
    rating: 9.2,
    reviewCount: 9800,
    isNowShowing: true,
    isComingSoon: false,
    isFeatured: false,
  }
];

export const MOCK_CINEMAS: Cinema[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'CINENOVA Landmark Sài Gòn',
    address: 'Tầng 5, Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
    city: 'Hồ Chí Minh',
    phone: '1900 6868',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'CINENOVA Tây Hồ Hà Nội',
    address: 'Tầng 4, Lotte Mall Tây Hồ, 272 Võ Chí Công, Phú Thượng, Tây Hồ, Hà Nội',
    city: 'Hà Nội',
    phone: '1900 8686',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'CINENOVA Sông Hàn Đà Nẵng',
    address: 'Tầng 3, Indochina Riverside, 74 Bạch Đằng, Hải Châu, Đà Nẵng',
    city: 'Đà Nẵng',
    phone: '1900 5656',
  }
];

// Helper to generate dynamic dates (today, tomorrow, next 5 days) in Asia/Ho_Chi_Minh
export function getBookingDates(): { label: string; dateStr: string; dayOfWeek: string }[] {
  const dates = [];
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Current date string in Vietnam (Asia/Ho_Chi_Minh)
  const vnDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // YYYY-MM-DD

  const [year, month, day] = vnDateStr.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day, 12, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate.getTime() + i * 86400000);
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

    const dayNum = d.getDate();
    const monthNum = d.getMonth() + 1;
    const dayOfWeek = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : daysOfWeek[d.getDay()];
    const label = `${dayNum}/${monthNum}`;
    dates.push({ label, dateStr, dayOfWeek });
  }
  return dates;
}

export const MOCK_SHOWTIMES: Showtime[] = [
  // Landmark Saigon
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    movieId: 'a1000000-0000-0000-0000-000000000001',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:30',
    endTime: '13:16',
    format: 'IMAX Laser',
    priceRegular: 140000,
    priceVip: 180000,
  },
  {
    id: 'e1000000-0000-0000-0000-000000000002',
    movieId: 'a1000000-0000-0000-0000-000000000010',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:49',
    format: 'IMAX Laser',
    priceRegular: 160000,
    priceVip: 200000,
  },
  {
    id: 'e1000000-0000-0000-0000-000000000003',
    movieId: 'a1000000-0000-0000-0000-000000000001',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:46',
    format: 'IMAX Laser',
    priceRegular: 160000,
    priceVip: 200000,
  },
  {
    id: 'e1000000-0000-0000-0000-000000000004',
    movieId: 'a1000000-0000-0000-0000-000000000006',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '21:30',
    endTime: '23:38',
    format: 'IMAX Laser',
    priceRegular: 150000,
    priceVip: 190000,
  },
  {
    id: 'st-5',
    movieId: 'a1000000-0000-0000-0000-000000000002',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000002',
    hallName: 'Cinema Hall 2 (Dolby Atmos)',
    date: new Date().toISOString().split('T')[0],
    startTime: '15:15',
    endTime: '18:15',
    format: '2D Digital',
    priceRegular: 95000,
    priceVip: 125000,
  },
  {
    id: 'st-6',
    movieId: 'a1000000-0000-0000-0000-000000000002',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '21:45',
    endTime: '00:45',
    format: 'IMAX Laser',
    priceRegular: 160000,
    priceVip: 200000,
  },
  {
    id: 'st-7',
    movieId: 'a1000000-0000-0000-0000-000000000006',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000002',
    hallName: 'Cinema Hall 2 (Dolby Atmos)',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:15',
    endTime: '21:23',
    format: '2D Digital',
    priceRegular: 100000,
    priceVip: 130000,
  },
  // Tay Ho Hanoi
  {
    id: 'st-8',
    movieId: 'a1000000-0000-0000-0000-000000000001',
    cinemaId: 'c1000000-0000-0000-0000-000000000002',
    cinemaName: 'CINENOVA Tây Hồ Hà Nội',
    hallId: 'b1000000-0000-0000-0000-000000000003',
    hallName: 'Phòng Chiếu 1 Deluxe',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    endTime: '13:46',
    format: '2D Digital',
    priceRegular: 90000,
    priceVip: 120000,
  },
  {
    id: 'st-9',
    movieId: 'a1000000-0000-0000-0000-000000000001',
    cinemaId: 'c1000000-0000-0000-0000-000000000002',
    cinemaName: 'CINENOVA Tây Hồ Hà Nội',
    hallId: 'b1000000-0000-0000-0000-000000000003',
    hallName: 'Phòng Chiếu 1 Deluxe',
    date: new Date().toISOString().split('T')[0],
    startTime: '17:45',
    endTime: '20:31',
    format: '2D Digital',
    priceRegular: 105000,
    priceVip: 135000,
  },
  {
    id: 'st-10',
    movieId: 'a1000000-0000-0000-0000-000000000003',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000002',
    hallName: 'Cinema Hall 2 (Dolby Atmos)',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:30',
    endTime: '15:20',
    format: '2D Digital',
    priceRegular: 85000,
    priceVip: 110000,
  },
  {
    id: 'st-11',
    movieId: 'a1000000-0000-0000-0000-000000000004',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000002',
    hallName: 'Cinema Hall 2 (Dolby Atmos)',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:35',
    format: '2D Digital',
    priceRegular: 85000,
    priceVip: 110000,
  },
  {
    id: 'st-12',
    movieId: 'a1000000-0000-0000-0000-000000000010',
    cinemaId: 'c1000000-0000-0000-0000-000000000001',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallId: 'b1000000-0000-0000-0000-000000000001',
    hallName: 'IMAX Laser Hall 1',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:49',
    format: 'IMAX Laser',
    priceRegular: 150000,
    priceVip: 190000,
  }
];

// Generate standard seat layout: Rows A-H (8 rows), Columns 1-12 (12 seats per row = 96 seats)
// A-C: Regular
// D-G: VIP
// H: Couple (seats 1-2, 3-4, 5-6, 7-8, 9-10, 11-12)
export function generateMockSeats(showtimeId: string, basePriceRegular = 95000, basePriceVip = 130000): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = 12;
  const seats: Seat[] = [];

  // Seed deterministic booked seats based on showtimeId
  const bookedSet = new Set<string>();
  const seedMultiplier = showtimeId.charCodeAt(showtimeId.length - 1) || 1;
  const sampleBookedNumbers = [
    `C${(seedMultiplier % 8) + 2}`,
    `D${(seedMultiplier % 7) + 3}`,
    `D${(seedMultiplier % 7) + 4}`,
    `E${(seedMultiplier % 6) + 4}`,
    `E${(seedMultiplier % 6) + 5}`,
    `E${(seedMultiplier % 6) + 6}`,
    `F${(seedMultiplier % 5) + 3}`,
    `F${(seedMultiplier % 5) + 4}`,
    `B7`, `B8`, `C5`
  ];
  sampleBookedNumbers.forEach(s => bookedSet.add(s));

  for (const row of rows) {
    for (let c = 1; c <= cols; c++) {
      const seatNumber = `${row}${c}`;
      let type: 'regular' | 'vip' | 'couple' = 'regular';
      let price = basePriceRegular;

      if (['D', 'E', 'F', 'G'].includes(row)) {
        type = 'vip';
        price = basePriceVip;
      } else if (row === 'H') {
        type = 'couple';
        price = basePriceVip * 1.8;
      }

      const isBooked = bookedSet.has(seatNumber);

      seats.push({
        id: `seat-${showtimeId}-${seatNumber}`,
        row,
        col: c,
        seatNumber,
        type,
        status: isBooked ? 'booked' : 'available',
        price,
      });
    }
  }

  return seats;
}

export const MOCK_ADMIN_BOOKINGS: BookingRecord[] = [
  {
    id: 'bk-1001',
    bookingCode: 'CN-89241',
    movieTitle: 'Hành Tinh Cát: Phần Hai',
    moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallName: 'IMAX Laser Hall 1',
    date: '2024-11-02',
    time: '18:30',
    seats: ['E05', 'E06'],
    totalPrice: 400000,
    customerName: 'Nguyễn Văn An',
    customerEmail: 'an.nguyen@example.com',
    customerPhone: '0903123456',
    paymentMethod: 'MoMo Demo',
    status: 'confirmed',
    createdAt: '2024-11-02 14:20',
  },
  {
    id: 'bk-1002',
    bookingCode: 'CN-89242',
    movieTitle: 'Deadpool & Wolverine',
    moviePoster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
    cinemaName: 'CINENOVA Tây Hồ Hà Nội',
    hallName: 'Phòng Chiếu 1 Deluxe',
    date: '2024-11-02',
    time: '19:15',
    seats: ['F04', 'F05', 'F06'],
    totalPrice: 390000,
    customerName: 'Trần Thị Mai',
    customerEmail: 'mai.tran@example.com',
    customerPhone: '0988765432',
    paymentMethod: 'VNPAY Demo',
    status: 'confirmed',
    createdAt: '2024-11-02 15:45',
  },
  {
    id: 'bk-1003',
    bookingCode: 'CN-89243',
    movieTitle: 'Oppenheimer',
    moviePoster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallName: 'Cinema Hall 2',
    date: '2024-11-02',
    time: '21:45',
    seats: ['D07', 'D08'],
    totalPrice: 250000,
    customerName: 'Lê Hoàng Long',
    customerEmail: 'long.le@example.com',
    customerPhone: '0912345678',
    paymentMethod: 'Thẻ Quốc Tế (Demo)',
    status: 'confirmed',
    createdAt: '2024-11-02 16:10',
  },
  {
    id: 'bk-1004',
    bookingCode: 'CN-89244',
    movieTitle: 'Interstellar IMAX',
    moviePoster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=80',
    cinemaName: 'CINENOVA Landmark Sài Gòn',
    hallName: 'IMAX Laser Hall 1',
    date: '2024-11-03',
    time: '08:00',
    seats: ['H05', 'H06'],
    totalPrice: 342000,
    customerName: 'Phạm Minh Quân',
    customerEmail: 'quan.pm@example.com',
    customerPhone: '0977889900',
    paymentMethod: 'ShopeePay Demo',
    status: 'pending',
    createdAt: '2024-11-02 17:05',
  },
  {
    id: 'bk-1005',
    bookingCode: 'CN-89245',
    movieTitle: 'Kẻ Trộm Mặt Trăng 4',
    moviePoster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    cinemaName: 'CINENOVA Sông Hàn Đà Nẵng',
    hallName: 'Hall 3',
    date: '2024-11-03',
    time: '10:00',
    seats: ['B03', 'B04', 'B05'],
    totalPrice: 255000,
    customerName: 'Hoàng Kim Ngân',
    customerEmail: 'ngan.hk@example.com',
    customerPhone: '0933221100',
    paymentMethod: 'MoMo Demo',
    status: 'confirmed',
    createdAt: '2024-11-02 17:30',
  }
];

export const MOCK_ADMIN_STATS: AdminStats = {
  totalBookings: 5,
  totalConfirmedBookings: 4,
  totalTicketsSold: 9,
  totalDemoRevenue: 720000,
  todayRevenue: 720000,
  monthlyRevenue: 720000,
  todayTickets: 9,
  occupancyRate: 78.4,
  growthRate: 14.8,
  bookingsByStatus: {
    confirmed: 4,
    pending: 1,
    cancelled: 0,
    expired: 0,
  },
  paymentMethodStats: [
    { method: 'momo', label: 'MoMo Demo', count: 3, amount: 540000, percentage: 75 },
    { method: 'vnpay', label: 'VNPay Demo', count: 1, amount: 180000, percentage: 25 },
  ],
  recentBookings: MOCK_ADMIN_BOOKINGS,
  revenueByDay: [
    { day: 'T2', date: '2026-11-02', revenue: 720000, tickets: 9 },
    { day: 'T3', date: '2026-11-03', revenue: 0, tickets: 0 },
    { day: 'T4', date: '2026-11-04', revenue: 0, tickets: 0 },
    { day: 'T5', date: '2026-11-05', revenue: 0, tickets: 0 },
    { day: 'T6', date: '2026-11-06', revenue: 0, tickets: 0 },
    { day: 'T7', date: '2026-11-07', revenue: 0, tickets: 0 },
    { day: 'CN', date: '2026-11-08', revenue: 0, tickets: 0 },
  ],
  popularMovies: [
    { title: 'Hành Tinh Cát: Phần Hai', tickets: 9, revenue: 720000, percentage: 100 },
  ],
};

