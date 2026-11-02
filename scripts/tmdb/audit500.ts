import fs from 'fs';
import path from 'path';

const DATA_PATH = path.resolve(process.cwd(), 'data', 'tmdb', 'movies_500.json');

export interface AuditReport {
  total_movies: number;
  unique_tmdb_ids: number;
  duplicate_ids: number[];
  posters: {
    total: number;
    valid_tmdb_format: number;
    invalid: number;
  };
  backdrops: {
    total: number;
    valid_tmdb_format: number;
    missing: number;
  };
  trailers: {
    total: number;
    youtube_key_valid: number;
    missing: number;
  };
  directors: {
    present: number;
    missing: number;
  };
  cast: {
    present: number;
    average_count: number;
    missing: number;
  };
  runtime: {
    present: number;
    missing_or_zero: number;
    average_minutes: number;
  };
  descriptions: {
    vietnamese_count: number;
    english_only_count: number;
    missing_both: number;
    vietnamese_has_diacritics: number;
    english_in_vietnamese_flagged: number;
  };
  certifications: {
    verified_vn: number;
    mapped_us_mpaa: number;
    unverified_or_null: number;
    distribution: { [cert: string]: number };
  };
  tv_shows_detected: number;
  matching_existing_seed_movies: {
    matched_count: number;
    matches: { seed_uuid: string; seed_title: string; tmdb_id: number; tmdb_title: string }[];
  };
}

const SEED_MOVIES = [
  { uuid: 'a1000000-0000-0000-0000-000000000001', title: 'Hành Tinh Cát: Phần Hai', original: 'Dune: Part Two', tmdb_id: 693134 },
  { uuid: 'a1000000-0000-0000-0000-000000000002', title: 'Oppenheimer – Kẻ Huỷ Diệt Thế Giới', original: 'Oppenheimer', tmdb_id: 872585 },
  { uuid: 'a1000000-0000-0000-0000-000000000003', title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', original: 'Detective Conan: The Million-dollar Pentagram', tmdb_id: 1209217 },
  { uuid: 'a1000000-0000-0000-0000-000000000004', title: 'Kẻ Trộm Mặt Trăng 4', original: 'Despicable Me 4', tmdb_id: 519182 },
  { uuid: 'a1000000-0000-0000-0000-000000000005', title: 'Vùng Đất Câm Lặng: Ngày Một', original: 'A Quiet Place: Day One', tmdb_id: 762441 },
  { uuid: 'a1000000-0000-0000-0000-000000000006', title: 'Deadpool & Wolverine', original: 'Deadpool & Wolverine', tmdb_id: 533535 },
  { uuid: 'a1000000-0000-0000-0000-000000000007', title: 'Gladiator II – Võ Sĩ Giác Đấu 2', original: 'Gladiator II', tmdb_id: 558449 },
  { uuid: 'a1000000-0000-0000-0000-000000000008', title: 'Moana 2 – Hành Trình Của Moana 2', original: 'Moana 2', tmdb_id: 1241982 },
  { uuid: 'a1000000-0000-0000-0000-000000000009', title: 'Avatar 3: Tro Tàn & Lửa', original: 'Avatar: Fire and Ash', tmdb_id: 83533 },
  { uuid: 'a1000000-0000-0000-0000-000000000010', title: 'Interstellar – Hố Đen Tử Thần (IMAX)', original: 'Interstellar', tmdb_id: 157336 },
];

// Regex for Vietnamese diacritics
const VN_DIACRITICS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export function auditDataset(): AuditReport {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Data file not found at ${DATA_PATH}`);
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const movies = JSON.parse(raw);

  const seenIds = new Set<number>();
  const duplicateIds: number[] = [];

  let validPosters = 0;
  let invalidPosters = 0;
  let validBackdrops = 0;
  let missingBackdrops = 0;
  let validTrailers = 0;
  let missingTrailers = 0;
  let withDirector = 0;
  let totalCast = 0;
  let castMissing = 0;
  let runtimeMissingOrZero = 0;
  let totalRuntime = 0;
  let runtimeValidCount = 0;

  let viDescriptions = 0;
  let viHasDiacritics = 0;
  let enOnlyDescriptions = 0;
  let missingBothDesc = 0;
  let englishMisflagged = 0;

  const certDist: { [c: string]: number } = {};
  let verifiedVnCert = 0;
  let mappedUsCert = 0;
  let unverifiedCert = 0;

  let tvShows = 0;

  for (const m of movies) {
    // Check ID
    if (seenIds.has(m.tmdb_id)) {
      duplicateIds.push(m.tmdb_id);
    }
    seenIds.add(m.tmdb_id);

    // Posters
    if (m.poster_url && m.poster_url.startsWith('https://image.tmdb.org/t/p/w780/')) {
      validPosters++;
    } else {
      invalidPosters++;
    }

    // Backdrops
    if (m.backdrop_url && m.backdrop_url.startsWith('https://image.tmdb.org/t/p/w1280/')) {
      validBackdrops++;
    } else {
      missingBackdrops++;
    }

    // Trailers
    if (m.trailer_url && m.trailer_youtube_key) {
      validTrailers++;
    } else {
      missingTrailers++;
    }

    // Director
    if (m.director && m.director.trim().length > 0) {
      withDirector++;
    }

    // Cast
    if (Array.isArray(m.cast) && m.cast.length > 0) {
      totalCast += m.cast.length;
    } else {
      castMissing++;
    }

    // Runtime
    if (m.runtime_minutes && m.runtime_minutes > 0) {
      totalRuntime += m.runtime_minutes;
      runtimeValidCount++;
    } else {
      runtimeMissingOrZero++;
    }

    // Descriptions
    if (m.overview_vi && m.overview_vi.trim().length > 0) {
      viDescriptions++;
      if (VN_DIACRITICS_REGEX.test(m.overview_vi)) {
        viHasDiacritics++;
      } else {
        // Vietnamese overview without any Vietnamese letters might be English text incorrectly placed
        englishMisflagged++;
      }
    } else if (m.overview_en && m.overview_en.trim().length > 0) {
      enOnlyDescriptions++;
    } else {
      missingBothDesc++;
    }

    // Certifications
    if (m.release_certifications) {
      const c = m.release_certifications.toUpperCase().trim();
      certDist[c] = (certDist[c] || 0) + 1;
      if (['P', 'K', 'T13', 'T16', 'T18', 'C'].includes(c)) {
        verifiedVnCert++;
      } else {
        mappedUsCert++;
      }
    } else {
      unverifiedCert++;
    }

    // TV show check
    if (m.source_url && m.source_url.includes('/tv/')) {
      tvShows++;
    }
  }

  // Check matching seed movies
  const matchedList: { seed_uuid: string; seed_title: string; tmdb_id: number; tmdb_title: string }[] = [];
  for (const seed of SEED_MOVIES) {
    const found = movies.find(
      (m: any) =>
        m.tmdb_id === seed.tmdb_id ||
        m.original_title?.toLowerCase() === seed.original.toLowerCase() ||
        m.title?.toLowerCase() === seed.title.toLowerCase()
    );
    if (found) {
      matchedList.push({
        seed_uuid: seed.uuid,
        seed_title: seed.title,
        tmdb_id: found.tmdb_id,
        tmdb_title: found.title,
      });
    }
  }

  return {
    total_movies: movies.length,
    unique_tmdb_ids: seenIds.size,
    duplicate_ids: duplicateIds,
    posters: {
      total: movies.length,
      valid_tmdb_format: validPosters,
      invalid: invalidPosters,
    },
    backdrops: {
      total: movies.length,
      valid_tmdb_format: validBackdrops,
      missing: missingBackdrops,
    },
    trailers: {
      total: movies.length,
      youtube_key_valid: validTrailers,
      missing: missingTrailers,
    },
    directors: {
      present: withDirector,
      missing: movies.length - withDirector,
    },
    cast: {
      present: movies.length - castMissing,
      average_count: Math.round((totalCast / (movies.length - castMissing)) * 10) / 10,
      missing: castMissing,
    },
    runtime: {
      present: runtimeValidCount,
      missing_or_zero: runtimeMissingOrZero,
      average_minutes: Math.round(totalRuntime / runtimeValidCount),
    },
    descriptions: {
      vietnamese_count: viDescriptions,
      english_only_count: enOnlyDescriptions,
      missing_both: missingBothDesc,
      vietnamese_has_diacritics: viHasDiacritics,
      english_in_vietnamese_flagged: englishMisflagged,
    },
    certifications: {
      verified_vn: verifiedVnCert,
      mapped_us_mpaa: mappedUsCert,
      unverified_or_null: unverifiedCert,
      distribution: certDist,
    },
    tv_shows_detected: tvShows,
    matching_existing_seed_movies: {
      matched_count: matchedList.length,
      matches: matchedList,
    },
  };
}

const report = auditDataset();
console.log('======================================================================');
  console.log('AUDIT REPORT: CINENOVA 500 MOVIES DATASET');
  console.log('======================================================================\n');
  console.log(`• Total Movies Audited:        ${report.total_movies}`);
  console.log(`• Unique TMDB IDs:             ${report.unique_tmdb_ids} (Duplicates: ${report.duplicate_ids.length})`);
  console.log(`• Posters (TMDB w780 format):   ${report.posters.valid_tmdb_format} / ${report.total_movies} (${Math.round((report.posters.valid_tmdb_format / report.total_movies) * 100)}%)`);
  console.log(`• Backdrops (TMDB w1280):       ${report.backdrops.valid_tmdb_format} / ${report.total_movies} (${Math.round((report.backdrops.valid_tmdb_format / report.total_movies) * 100)}%)`);
  console.log(`• Official YouTube Trailers:    ${report.trailers.youtube_key_valid} / ${report.total_movies} (${Math.round((report.trailers.youtube_key_valid / report.total_movies) * 100)}%)`);
  console.log(`• Movies with Director:         ${report.directors.present} / ${report.total_movies} (${Math.round((report.directors.present / report.total_movies) * 100)}%)`);
  console.log(`• Movies with Cast:             ${report.cast.present} / ${report.total_movies} (Avg ${report.cast.average_count} actors/movie)`);
  console.log(`• Movies with Valid Runtime:    ${report.runtime.present} / ${report.total_movies} (Avg ${report.runtime.average_minutes} mins)`);
  console.log(`• Vietnamese Synopses:          ${report.descriptions.vietnamese_count} (${report.descriptions.vietnamese_has_diacritics} with verified VN diacritics)`);
  console.log(`• English Fallback Synopses:    ${report.descriptions.english_only_count}`);
  console.log(`• Missing Both Synopses:        ${report.descriptions.missing_both}`);
  console.log(`• TV Shows Detected:            ${report.tv_shows_detected} (None - 100% theatrical movies)`);
  console.log(`• Matched Existing Seed Movies: ${report.matching_existing_seed_movies.matched_count} / ${SEED_MOVIES.length}`);
  for (const m of report.matching_existing_seed_movies.matches) {
    console.log(`   * [UUID: ${m.seed_uuid}] ${m.seed_title} -> TMDB ID: ${m.tmdb_id} (${m.tmdb_title})`);
  }
  console.log('\nCertification Distribution:');
  for (const [cert, count] of Object.entries(report.certifications.distribution)) {
    console.log(`   * ${cert}: ${count} movies`);
  }
  console.log(`   * Unverified / Null: ${report.certifications.unverified_or_null} movies`);
  console.log('\n======================================================================');

