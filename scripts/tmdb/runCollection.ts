import fs from 'fs';
import path from 'path';
import {
  RawTmdbMovie,
  CollectionReport,
  getTmdbToken,
  fetchWithRetry,
  extractCertification,
  extractTrailer,
  mapGenres,
} from './collector';

const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'tmdb');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, 'checkpoint.json');
const ERRORS_FILE = path.join(OUTPUT_DIR, 'fetch_errors.json');

interface DiscoverySource {
  name: string;
  category: string;
  url: string;
}

function buildDiscoverySources(): DiscoverySource[] {
  const sources: DiscoverySource[] = [];

  // 1. Vietnamese Cinema (Origins VN, Language vi)
  for (let p = 1; p <= 5; p++) {
    sources.push({
      name: `Vietnam Origins (Page ${p})`,
      category: 'vietnam',
      url: `https://api.themoviedb.org/3/discover/movie?with_origin_country=VN&sort_by=vote_count.desc&page=${p}`,
    });
    sources.push({
      name: `Vietnam Language Popular (Page ${p})`,
      category: 'vietnam',
      url: `https://api.themoviedb.org/3/discover/movie?with_original_language=vi&sort_by=popularity.desc&page=${p}`,
    });
  }

  // 2. Korean Cinema (Origin KR)
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Korean Top Voted (Page ${p})`,
      category: 'korean',
      url: `https://api.themoviedb.org/3/discover/movie?with_origin_country=KR&vote_count.gte=100&sort_by=vote_count.desc&page=${p}`,
    });
    sources.push({
      name: `Korean Popular (Page ${p})`,
      category: 'korean',
      url: `https://api.themoviedb.org/3/discover/movie?with_original_language=ko&sort_by=popularity.desc&page=${p}`,
    });
  }

  // 3. Japanese Cinema & Anime (Origin JP, Animation genre 16)
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Japan Anime Top Voted (Page ${p})`,
      category: 'japan_anime',
      url: `https://api.themoviedb.org/3/discover/movie?with_origin_country=JP&with_genres=16&vote_count.gte=100&sort_by=vote_count.desc&page=${p}`,
    });
    sources.push({
      name: `Japan Live Action & Pop (Page ${p})`,
      category: 'japan_anime',
      url: `https://api.themoviedb.org/3/discover/movie?with_origin_country=JP&vote_count.gte=80&sort_by=popularity.desc&page=${p}`,
    });
  }

  // 4. China & Hong Kong Cinema
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `China / Hong Kong Voted (Page ${p})`,
      category: 'china_hongkong',
      url: `https://api.themoviedb.org/3/discover/movie?with_origin_country=CN|HK&vote_count.gte=100&sort_by=vote_count.desc&page=${p}`,
    });
  }

  // 5. Hollywood Sci-Fi & Action
  for (let p = 1; p <= 5; p++) {
    sources.push({
      name: `Sci-Fi Blockbusters (Page ${p})`,
      category: 'scifi',
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=878&vote_count.gte=2000&sort_by=vote_count.desc&page=${p}`,
    });
    sources.push({
      name: `Action Blockbusters (Page ${p})`,
      category: 'action',
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=28&vote_count.gte=2500&sort_by=vote_count.desc&page=${p}`,
    });
  }

  // 6. Animation & Family Favorites
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Animation Top Voted (Page ${p})`,
      category: 'animation',
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=16,10751&vote_count.gte=2000&sort_by=vote_count.desc&page=${p}`,
    });
  }

  // 7. Horror & Thriller
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Horror Masterpieces (Page ${p})`,
      category: 'horror',
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=27&vote_count.gte=1200&sort_by=vote_count.desc&page=${p}`,
    });
  }

  // 8. Romance & Comedy & Drama
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Romance & Drama Favorites (Page ${p})`,
      category: 'romance',
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=10749&vote_count.gte=1800&sort_by=vote_count.desc&page=${p}`,
    });
  }

  // 9. All-Time Classics (Pre-2005)
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `All-Time Classics (Page ${p})`,
      category: 'classics',
      url: `https://api.themoviedb.org/3/discover/movie?primary_release_date.lte=2005-01-01&vote_count.gte=3500&sort_by=vote_average.desc&page=${p}`,
    });
  }

  // 10. Theatrical Releases (Now Playing, Popular, Upcoming)
  for (let p = 1; p <= 4; p++) {
    sources.push({
      name: `Now Playing Theatrical (Page ${p})`,
      category: 'theatrical_now',
      url: `https://api.themoviedb.org/3/movie/now_playing?page=${p}`,
    });
    sources.push({
      name: `Popular Current (Page ${p})`,
      category: 'theatrical_popular',
      url: `https://api.themoviedb.org/3/movie/popular?page=${p}`,
    });
  }

  return sources;
}

interface DiscoveredItem {
  id: number;
  title: string;
  category: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

async function discoverMovies(token: string): Promise<DiscoveredItem[]> {
  const sources = buildDiscoverySources();
  console.log(`[Discovery] Scanning ${sources.length} diverse queries across regions and genres...`);

  const seenIds = new Set<number>();
  const discovered: DiscoveredItem[] = [];

  for (const src of sources) {
    try {
      const data = await fetchWithRetry(src.url, token);
      if (!data || !Array.isArray(data.results)) continue;

      let addedFromSrc = 0;
      for (const item of data.results) {
        if (!item.id || seenIds.has(item.id)) continue;
        if (item.adult) continue;
        // Require at least a poster
        if (!item.poster_path) continue;

        seenIds.add(item.id);
        discovered.push({
          id: item.id,
          title: item.title || item.original_title,
          category: src.category,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
        });
        addedFromSrc++;
      }

      // Small throttle between discovery pages
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.warn(`[Discovery Warning] Failed source "${src.name}":`, err.message);
    }
  }

  console.log(`[Discovery Completed] Discovered ${discovered.length} unique candidates.`);
  return discovered;
}

async function enrichMovie(
  item: DiscoveredItem,
  token: string,
  fetchErrors: { id: number; title: string; error: string }[]
): Promise<RawTmdbMovie | null> {
  const movieId = item.id;
  const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits,videos,images,release_dates,external_ids&language=vi-VN`;

  try {
    const data = await fetchWithRetry(detailUrl, token);
    if (!data || data.adult) return null;

    // Poster path is mandatory for quality
    const posterPath = data.poster_path || item.poster_path || null;
    const backdropPath = data.backdrop_path || item.backdrop_path || null;

    if (!posterPath) {
      return null;
    }

    // Check Vietnamese title & overview
    let titleVi: string | null = data.title && data.title !== data.original_title ? data.title : null;
    let overviewVi: string | null = data.overview && data.overview.trim().length > 10 ? data.overview.trim() : null;
    let overviewEn: string | null = null;
    let trailerKey: string | null = null;
    let trailerUrl: string | null = null;

    // Check trailer in Vietnamese response
    const viTrailer = extractTrailer(data.videos?.results);
    if (viTrailer) {
      trailerKey = viTrailer.key;
      trailerUrl = viTrailer.url;
    }

    // If overviewVi is missing OR trailer is missing, fetch English auxiliary details
    if (!overviewVi || !trailerKey) {
      const enUrl = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=videos&language=en-US`;
      const enData = await fetchWithRetry(enUrl, token);
      if (enData) {
        if (!overviewVi && enData.overview && enData.overview.trim().length > 10) {
          overviewEn = enData.overview.trim();
        } else if (enData.overview) {
          overviewEn = enData.overview.trim();
        }

        if (!titleVi && enData.title && enData.title !== data.original_title) {
          // If we had no title_vi, we can still use English title for reference
        }

        if (!trailerKey) {
          const enTrailer = extractTrailer(enData.videos?.results);
          if (enTrailer) {
            trailerKey = enTrailer.key;
            trailerUrl = enTrailer.url;
          }
        }
      }
    }

    // Genres mapping
    const { vi: genresVi, en: genresEn } = mapGenres(data.genres);

    // Director from crew
    let director: string | null = null;
    if (data.credits?.crew && Array.isArray(data.credits.crew)) {
      const dirObj = data.credits.crew.find((c: any) => c.job === 'Director');
      if (dirObj?.name) {
        director = dirObj.name.trim();
      }
    }

    // Cast (top 8)
    const cast: string[] = [];
    if (data.credits?.cast && Array.isArray(data.credits.cast)) {
      for (const actor of data.credits.cast.slice(0, 8)) {
        if (actor.name) cast.push(actor.name.trim());
      }
    }

    // Release certifications
    const certification = extractCertification(data.release_dates?.results);

    // Production countries
    const countries: string[] = [];
    if (Array.isArray(data.production_countries)) {
      for (const c of data.production_countries) {
        if (c.name) countries.push(c.name);
      }
    }

    // Release year
    let releaseYear: number | null = null;
    if (data.release_date && data.release_date.length >= 4) {
      const y = parseInt(data.release_date.substring(0, 4), 10);
      if (!isNaN(y)) releaseYear = y;
    }

    const movieRecord: RawTmdbMovie = {
      tmdb_id: data.id,
      imdb_id: data.external_ids?.imdb_id || data.imdb_id || null,
      title: data.title || item.title || data.original_title,
      original_title: data.original_title || data.title,
      title_vi: titleVi || (overviewVi ? data.title : null),
      overview_vi: overviewVi,
      overview_en: overviewEn,
      release_date: data.release_date || null,
      release_year: releaseYear,
      runtime_minutes: data.runtime || null,
      genres: genresVi,
      genres_en: genresEn,
      original_language: data.original_language || 'en',
      production_countries: countries,
      director,
      cast,
      poster_path: posterPath,
      backdrop_path: backdropPath,
      poster_url: posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : null,
      backdrop_url: backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null,
      trailer_youtube_key: trailerKey,
      trailer_url: trailerUrl,
      vote_average: Math.round((data.vote_average || 0) * 10) / 10,
      vote_count: data.vote_count || 0,
      popularity: Math.round((data.popularity || 0) * 10) / 10,
      release_certifications: certification,
      category_tag: item.category,
      source_url: `https://www.themoviedb.org/movie/${data.id}`,
      fetched_at: new Date().toISOString(),
    };

    return movieRecord;
  } catch (err: any) {
    fetchErrors.push({
      id: movieId,
      title: item.title,
      error: err.message,
    });
    return null;
  }
}

function exportCsv(movies: RawTmdbMovie[], filePath: string) {
  const headers = [
    'tmdb_id',
    'imdb_id',
    'title',
    'original_title',
    'title_vi',
    'release_date',
    'release_year',
    'runtime_minutes',
    'genres',
    'original_language',
    'production_countries',
    'director',
    'cast',
    'vote_average',
    'vote_count',
    'popularity',
    'release_certifications',
    'category_tag',
    'poster_url',
    'backdrop_url',
    'trailer_url',
    'source_url',
    'has_overview_vi',
    'overview_vi',
    'overview_en',
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = '';
    if (Array.isArray(val)) {
      str = val.join(', ');
    } else {
      str = String(val);
    }
    // Escape quotes
    return `"${str.replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
  };

  const rows = [headers.join(',')];
  for (const m of movies) {
    const row = [
      m.tmdb_id,
      escapeCsv(m.imdb_id),
      escapeCsv(m.title),
      escapeCsv(m.original_title),
      escapeCsv(m.title_vi),
      escapeCsv(m.release_date),
      m.release_year ?? '',
      m.runtime_minutes ?? '',
      escapeCsv(m.genres),
      escapeCsv(m.original_language),
      escapeCsv(m.production_countries),
      escapeCsv(m.director),
      escapeCsv(m.cast),
      m.vote_average,
      m.vote_count,
      m.popularity,
      escapeCsv(m.release_certifications),
      escapeCsv(m.category_tag),
      escapeCsv(m.poster_url),
      escapeCsv(m.backdrop_url),
      escapeCsv(m.trailer_url),
      escapeCsv(m.source_url),
      m.overview_vi ? 'YES' : 'NO',
      escapeCsv(m.overview_vi),
      escapeCsv(m.overview_en),
    ];
    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility on Windows
  fs.writeFileSync(filePath, '\uFEFF' + rows.join('\r\n'), 'utf8');
}

function exportMissingMetadataCsv(movies: RawTmdbMovie[], filePath: string) {
  const missing = movies.filter(
    (m) =>
      !m.director ||
      m.cast.length === 0 ||
      !m.backdrop_url ||
      !m.trailer_url ||
      (!m.overview_vi && !m.overview_en)
  );

  const headers = [
    'tmdb_id',
    'title',
    'missing_director',
    'missing_cast',
    'missing_backdrop',
    'missing_trailer',
    'missing_overview_vi',
    'missing_overview_en',
    'category_tag',
  ];

  const rows = [headers.join(',')];
  for (const m of missing) {
    rows.push(
      [
        m.tmdb_id,
        `"${m.title.replace(/"/g, '""')}"`,
        !m.director ? 'MISSING' : 'OK',
        m.cast.length === 0 ? 'MISSING' : 'OK',
        !m.backdrop_url ? 'MISSING' : 'OK',
        !m.trailer_url ? 'MISSING' : 'OK',
        !m.overview_vi ? 'MISSING' : 'OK',
        !m.overview_en ? 'MISSING' : 'OK',
        m.category_tag,
      ].join(',')
    );
  }

  fs.writeFileSync(filePath, '\uFEFF' + rows.join('\r\n'), 'utf8');
}

export async function run() {
  const startTime = Date.now();
  console.log('======================================================================');
  console.log('CINENOVA PHASE 4A: AUTOMATED TMDB MOVIE DATA COLLECTION');
  console.log('======================================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const token = getTmdbToken();
  console.log('✅ TMDB Authentication Token active and ready.\n');

  // Check checkpoint
  let collectedMovies: RawTmdbMovie[] = [];
  const processedIds = new Set<number>();

  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      if (Array.isArray(saved) && saved.length > 0) {
        collectedMovies = saved;
        for (const m of collectedMovies) {
          processedIds.add(m.tmdb_id);
        }
        console.log(`[Checkpoint] Resuming from checkpoint with ${collectedMovies.length} already collected movies.`);
      }
    } catch {
      console.log('[Checkpoint] Fresh start.');
    }
  }

  const fetchErrors: { id: number; title: string; error: string }[] = [];

  // Step 1: Discover candidates
  const candidates = await discoverMovies(token);

  // Filter candidates not yet processed
  const remainingCandidates = candidates.filter((c) => !processedIds.has(c.id));
  console.log(`[Processing] ${remainingCandidates.length} new candidates remaining to evaluate...\n`);

  // Target: at least 300 movies, up to 500
  const TARGET_500 = 500;
  const BATCH_SIZE = 5;

  for (let i = 0; i < remainingCandidates.length && collectedMovies.length < TARGET_500; i += BATCH_SIZE) {
    const batch = remainingCandidates.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map((c) => enrichMovie(c, token, fetchErrors))
    );

    for (const res of results) {
      if (res && !processedIds.has(res.tmdb_id)) {
        processedIds.add(res.tmdb_id);
        collectedMovies.push(res);
      }
    }

    const currentCount = collectedMovies.length;
    process.stdout.write(`\r[Collection Progress] Collected: ${currentCount} / 500 movies... `);

    // Save checkpoint every 25 movies
    if (collectedMovies.length % 25 === 0 || collectedMovies.length >= TARGET_500) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(collectedMovies, null, 2), 'utf8');
    }

    // Save 300 milestone immediately when reached
    if (collectedMovies.length >= 300 && !fs.existsSync(path.join(OUTPUT_DIR, 'movies_300.json'))) {
      const first300 = collectedMovies.slice(0, 300);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'movies_300.json'), JSON.stringify(first300, null, 2), 'utf8');
      exportCsv(first300, path.join(OUTPUT_DIR, 'movies_300.csv'));
      console.log(`\n🎉 Milestone Reached: 300 movies exported to movies_300.json and movies_300.csv!`);
    }

    // Polite delay between batches
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n\n[Collection Finished] Total Collected: ${collectedMovies.length} movies.`);

  // Write 300 dataset (first 300)
  const movies300 = collectedMovies.slice(0, Math.min(300, collectedMovies.length));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'movies_300.json'), JSON.stringify(movies300, null, 2), 'utf8');
  exportCsv(movies300, path.join(OUTPUT_DIR, 'movies_300.csv'));

  // If we collected 500, write 500 dataset
  if (collectedMovies.length >= 500) {
    const movies500 = collectedMovies.slice(0, 500);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'movies_500.json'), JSON.stringify(movies500, null, 2), 'utf8');
    exportCsv(movies500, path.join(OUTPUT_DIR, 'movies_500.csv'));
  }

  // Missing metadata export
  exportMissingMetadataCsv(collectedMovies, path.join(OUTPUT_DIR, 'missing_metadata.csv'));

  // Fetch errors export
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(fetchErrors, null, 2), 'utf8');

  // Generate Report
  const catCounts: { [cat: string]: number } = {};
  const langCounts: { [lang: string]: number } = {};

  let withPoster = 0;
  let withBackdrop = 0;
  let withBoth = 0;
  let withTrailer = 0;
  let withOverviewVi = 0;
  let withDirector = 0;
  let withCast = 0;

  for (const m of collectedMovies) {
    catCounts[m.category_tag] = (catCounts[m.category_tag] || 0) + 1;
    langCounts[m.original_language] = (langCounts[m.original_language] || 0) + 1;

    if (m.poster_url) withPoster++;
    if (m.backdrop_url) withBackdrop++;
    if (m.poster_url && m.backdrop_url) withBoth++;
    if (m.trailer_url) withTrailer++;
    if (m.overview_vi) withOverviewVi++;
    if (m.director) withDirector++;
    if (m.cast && m.cast.length > 0) withCast++;
  }

  const report: CollectionReport = {
    generated_at: new Date().toISOString(),
    total_movies_collected: collectedMovies.length,
    movies_with_poster: withPoster,
    movies_with_backdrop: withBackdrop,
    movies_with_both_images: withBoth,
    movies_with_trailer: withTrailer,
    movies_with_overview_vi: withOverviewVi,
    movies_with_director: withDirector,
    movies_with_cast: withCast,
    movies_by_category: catCounts,
    movies_by_language: langCounts,
    missing_metadata_count: collectedMovies.filter(
      (m) => !m.director || !m.backdrop_url || !m.trailer_url || (!m.overview_vi && !m.overview_en)
    ).length,
    dedup_skipped_count: candidates.length - collectedMovies.length,
    fetch_error_count: fetchErrors.length,
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'collection_report.json'), JSON.stringify(report, null, 2), 'utf8');

  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

  console.log('\n======================================================================');
  console.log('COLLECTION METRICS & QUALITY REPORT');
  console.log('======================================================================');
  console.log(`• Total Movies Collected:     ${report.total_movies_collected}`);
  console.log(`• Movies with Poster:         ${report.movies_with_poster} (${Math.round((withPoster / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Backdrop:       ${report.movies_with_backdrop} (${Math.round((withBackdrop / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Both Images:    ${report.movies_with_both_images} (${Math.round((withBoth / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Trailer:        ${report.movies_with_trailer} (${Math.round((withTrailer / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Vietnamese Syn: ${report.movies_with_overview_vi} (${Math.round((withOverviewVi / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Director:       ${report.movies_with_director} (${Math.round((withDirector / report.total_movies_collected) * 100)}%)`);
  console.log(`• Movies with Cast:           ${report.movies_with_cast} (${Math.round((withCast / report.total_movies_collected) * 100)}%)`);
  console.log(`• Duration:                   ${elapsedSeconds} seconds`);
  console.log('======================================================================\n');
}

run().catch((err) => {
  console.error('Fatal collection error:', err);
  process.exit(1);
});
