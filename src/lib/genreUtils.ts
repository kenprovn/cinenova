// Canonical genre map to unify casing and naming variations
const GENRE_CANONICAL_MAP: Record<string, string> = {
  // Hài
  'hài': 'Hài',
  'hài hước': 'Hài',
  'hai': 'Hài',
  'hai huoc': 'Hài',
  'comedy': 'Hài',

  // Hành động
  'hành động': 'Hành Động',
  'hanh dong': 'Hành Động',
  'action': 'Hành Động',

  // Khoa học viễn tưởng
  'khoa học viễn tưởng': 'Khoa Học Viễn Tưởng',
  'khoa hoc vien tuong': 'Khoa Học Viễn Tưởng',
  'science fiction': 'Khoa Học Viễn Tưởng',
  'sci-fi': 'Khoa Học Viễn Tưởng',

  // Hoạt hình
  'hoạt hình': 'Hoạt Hình',
  'hoat hinh': 'Hoạt Hình',
  'animation': 'Hoạt Hình',

  // Chính kịch
  'chính kịch': 'Chính Kịch',
  'chinh kich': 'Chính Kịch',
  'drama': 'Chính Kịch',

  // Tội phạm
  'tội phạm': 'Tội Phạm',
  'toi pham': 'Tội Phạm',
  'crime': 'Tội Phạm',

  // Bí ẩn / Trinh thám
  'bí ẩn': 'Bí Ẩn',
  'bi an': 'Bí Ẩn',
  'trinh thám': 'Bí Ẩn',
  'trinh tham': 'Bí Ẩn',
  'mystery': 'Bí Ẩn',

  // Kinh dị
  'kinh dị': 'Kinh Dị',
  'kinh di': 'Kinh Dị',
  'horror': 'Kinh Dị',

  // Phiêu lưu
  'phiêu lưu': 'Phiêu Lưu',
  'phieu luu': 'Phiêu Lưu',
  'adventure': 'Phiêu Lưu',

  // Giật gân / Hồi hộp
  'giật gân': 'Giật Gân',
  'giat gan': 'Giật Gân',
  'hồi hộp': 'Giật Gân',
  'hoi hop': 'Giật Gân',
  'thriller': 'Giật Gân',

  // Lãng mạn
  'lãng mạn': 'Lãng Mạn',
  'lang man': 'Lãng Mạn',
  'romance': 'Lãng Mạn',

  // Gia đình
  'gia đình': 'Gia Đình',
  'gia dinh': 'Gia Đình',
  'family': 'Gia Đình',

  // Giả tưởng
  'giả tưởng': 'Giả Tưởng',
  'gia tuong': 'Giả Tưởng',
  'fantasy': 'Giả Tưởng',

  // Lịch sử / Tiểu sử
  'lịch sử': 'Lịch Sử',
  'lich su': 'Lịch Sử',
  'tiểu sử': 'Lịch Sử',
  'tieu su': 'Lịch Sử',
  'history': 'Lịch Sử',
  'biography': 'Lịch Sử',

  // Chiến tranh
  'chiến tranh': 'Chiến Tranh',
  'chien tranh': 'Chiến Tranh',
  'war': 'Chiến Tranh',

  // Âm nhạc
  'âm nhạc': 'Âm Nhạc',
  'am nhac': 'Âm Nhạc',
  'music': 'Âm Nhạc',

  // Tài liệu
  'phim tài liệu': 'Tài Liệu',
  'tài liệu': 'Tài Liệu',
  'tai lieu': 'Tài Liệu',
  'documentary': 'Tài Liệu',

  // Miền Tây
  'miền tây': 'Miền Tây',
  'western': 'Miền Tây',
};

/**
 * Normalizes a genre name to its standardized Vietnamese title-case form.
 */
export function normalizeGenre(g: string): string {
  if (!g) return '';
  const clean = g.trim().toLowerCase();
  if (GENRE_CANONICAL_MAP[clean]) {
    return GENRE_CANONICAL_MAP[clean];
  }
  // Title-case fallback
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Checks if a movie's genres list contains the target genre under canonical matching.
 */
export function movieMatchesGenre(movieGenres: string[] | undefined, targetGenre: string): boolean {
  if (!targetGenre || targetGenre === 'all') return true;
  if (!Array.isArray(movieGenres) || movieGenres.length === 0) return false;

  const normalizedTarget = normalizeGenre(targetGenre);
  return movieGenres.some((g) => normalizeGenre(g) === normalizedTarget);
}

