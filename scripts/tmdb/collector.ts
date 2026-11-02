import fs from 'fs';
import path from 'path';

export interface RawTmdbMovie {
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  original_title: string;
  title_vi: string | null;
  overview_vi: string | null;
  overview_en: string | null;
  release_date: string | null;
  release_year: number | null;
  runtime_minutes: number | null;
  genres: string[];
  genres_en: string[];
  original_language: string;
  production_countries: string[];
  director: string | null;
  cast: string[];
  poster_path: string | null;
  backdrop_path: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_youtube_key: string | null;
  trailer_url: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_certifications: string | null;
  age_rating_vi?: string | null;
  certification_origin?: string | null;
  category_tag: string;
  source_url: string;
  fetched_at: string;
}

export interface CollectionReport {
  generated_at: string;
  total_movies_collected: number;
  movies_with_poster: number;
  movies_with_backdrop: number;
  movies_with_both_images: number;
  movies_with_trailer: number;
  movies_with_overview_vi: number;
  movies_with_director: number;
  movies_with_cast: number;
  movies_by_category: { [category: string]: number };
  movies_by_language: { [lang: string]: number };
  missing_metadata_count: number;
  dedup_skipped_count: number;
  fetch_error_count: number;
}

const GENRE_MAP_VI: { [id: number]: string } = {
  28: 'Hành Động',
  12: 'Phiêu Lưu',
  16: 'Hoạt Hình',
  35: 'Hài',
  80: 'Tội Phạm',
  99: 'Phim Tài Liệu',
  18: 'Chính Kịch',
  10751: 'Gia Đình',
  14: 'Giả Tưởng',
  36: 'Lịch Sử',
  27: 'Kinh Dị',
  10402: 'Âm Nhạc',
  9648: 'Bí Ẩn',
  10749: 'Lãng Mạn',
  878: 'Khoa Học Viễn Tưởng',
  10770: 'Phim Truyền Hình',
  53: 'Giật Gân',
  10752: 'Chiến Tranh',
  37: 'Miền Tây',
};

const GENRE_MAP_EN: { [id: number]: string } = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export function getTmdbToken(): string {
  const envPath = path.resolve(process.cwd(), '.env.tmdb');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.tmdb file does not exist at ' + envPath);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/TMDB_READ_ACCESS_TOKEN\s*=\s*(.+)/);
  if (!match || !match[1].trim()) {
    throw new Error('TMDB_READ_ACCESS_TOKEN is missing or empty in .env.tmdb');
  }
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

export async function fetchWithRetry(url: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
        console.warn(`[TMDB 429 Rate Limit] Waiting ${retryAfter}s before retry...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        if (attempt === retries) {
          throw new Error(`HTTP ${res.status}: ${res.statusText} (${url})`);
        }
        await new Promise((r) => setTimeout(r, attempt * 1000));
        continue;
      }

      return await res.json();
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return null;
}

export function extractCertification(releaseDatesResults: any[]): string | null {
  if (!Array.isArray(releaseDatesResults)) return null;

  // Only extract verified Vietnam release certification (P, K, T13, T16, T18, C)
  const vnRelease = releaseDatesResults.find((r) => r.iso_3166_1 === 'VN');
  if (vnRelease && Array.isArray(vnRelease.release_dates)) {
    for (const d of vnRelease.release_dates) {
      if (d.certification && d.certification.trim()) {
        const cert = d.certification.trim().toUpperCase();
        if (cert === 'P') return 'P';
        if (cert === 'K') return 'K';
        if (cert === 'T13' || cert === '13+' || cert === 'C13') return 'T13';
        if (cert === 'T16' || cert === '16+' || cert === 'C16') return 'T16';
        if (cert === 'T18' || cert === '18+' || cert === 'C18') return 'T18';
        if (cert === 'C') return 'C';
      }
    }
  }

  // Do NOT fake-convert MPAA or foreign ratings to Vietnamese ratings
  return null;
}

export function extractOriginCertification(
  releaseDatesResults: any[],
  originalLang?: string
): string | null {
  if (!Array.isArray(releaseDatesResults)) return null;

  const priorityIsos: string[] = [];
  if (originalLang === 'en') priorityIsos.push('US', 'GB');
  else if (originalLang === 'ko') priorityIsos.push('KR');
  else if (originalLang === 'ja') priorityIsos.push('JP');
  else if (originalLang === 'fr') priorityIsos.push('FR');
  else if (originalLang === 'zh') priorityIsos.push('HK', 'TW', 'CN');

  priorityIsos.push('US', 'GB', 'DE', 'FR', 'KR', 'JP');

  for (const iso of priorityIsos) {
    const entry = releaseDatesResults.find((r) => r.iso_3166_1 === iso);
    if (entry && Array.isArray(entry.release_dates)) {
      for (const d of entry.release_dates) {
        if (d.certification && d.certification.trim()) {
          return `${iso}: ${d.certification.trim()}`;
        }
      }
    }
  }

  for (const r of releaseDatesResults) {
    if (Array.isArray(r.release_dates)) {
      for (const d of r.release_dates) {
        if (d.certification && d.certification.trim()) {
          return `${r.iso_3166_1}: ${d.certification.trim()}`;
        }
      }
    }
  }

  return null;
}

export function extractTrailer(videosResults: any[]): { key: string; url: string } | null {
  if (!Array.isArray(videosResults) || videosResults.length === 0) return null;

  // Filter YouTube videos
  const ytVideos = videosResults.filter((v) => v.site === 'YouTube' && v.key);
  if (ytVideos.length === 0) return null;

  // 1. Prioritize official trailer
  let chosen = ytVideos.find((v) => v.type === 'Trailer' && v.official);
  // 2. Any trailer
  if (!chosen) chosen = ytVideos.find((v) => v.type === 'Trailer');
  // 3. Any teaser
  if (!chosen) chosen = ytVideos.find((v) => v.type === 'Teaser');
  // 4. Any clip
  if (!chosen) chosen = ytVideos[0];

  if (!chosen) return null;

  return {
    key: chosen.key,
    url: `https://www.youtube.com/watch?v=${chosen.key}`,
  };
}

export function mapGenres(genreObjs: any[]): { vi: string[]; en: string[] } {
  if (!Array.isArray(genreObjs)) return { vi: [], en: [] };
  const vi: string[] = [];
  const en: string[] = [];

  for (const g of genreObjs) {
    if (g.name) {
      en.push(g.name);
    }
    const viName = GENRE_MAP_VI[g.id] || g.name;
    if (viName && !vi.includes(viName)) {
      vi.push(viName);
    }
  }

  return { vi, en };
}

