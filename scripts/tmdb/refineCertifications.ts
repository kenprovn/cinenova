import fs from 'fs';
import path from 'path';
import { getTmdbToken, fetchWithRetry } from './collector';

interface ReleaseDatesResponse {
  id: number;
  results: {
    iso_3166_1: string;
    release_dates: {
      certification: string;
      note?: string;
      type?: number;
      release_date?: string;
    }[];
  }[];
}

export function extractVnCertification(results: ReleaseDatesResponse['results']): string | null {
  if (!Array.isArray(results)) return null;
  const vn = results.find((r) => r.iso_3166_1 === 'VN');
  if (!vn || !Array.isArray(vn.release_dates)) return null;

  for (const d of vn.release_dates) {
    if (d.certification && d.certification.trim()) {
      const c = d.certification.trim().toUpperCase();
      if (c === 'P') return 'P';
      if (c === 'K') return 'K';
      if (c === 'T13' || c === '13+' || c === 'C13') return 'T13';
      if (c === 'T16' || c === '16+' || c === 'C16') return 'T16';
      if (c === 'T18' || c === '18+' || c === 'C18') return 'T18';
      if (c === 'C') return 'C';
    }
  }
  return null;
}

export function extractOriginCertification(
  results: ReleaseDatesResponse['results'],
  originalLang?: string,
  productionCountries?: string[]
): string | null {
  if (!Array.isArray(results)) return null;

  // Candidate countries in priority order
  const priorityIsos: string[] = [];
  if (originalLang === 'en') priorityIsos.push('US', 'GB');
  else if (originalLang === 'ko') priorityIsos.push('KR');
  else if (originalLang === 'ja') priorityIsos.push('JP');
  else if (originalLang === 'fr') priorityIsos.push('FR');
  else if (originalLang === 'zh') priorityIsos.push('HK', 'TW', 'CN');

  priorityIsos.push('US', 'GB', 'DE', 'FR', 'KR', 'JP');

  for (const iso of priorityIsos) {
    const entry = results.find((r) => r.iso_3166_1 === iso);
    if (entry && Array.isArray(entry.release_dates)) {
      for (const d of entry.release_dates) {
        if (d.certification && d.certification.trim()) {
          const cert = d.certification.trim();
          return `${iso}: ${cert}`;
        }
      }
    }
  }

  // Any non-empty certification
  for (const r of results) {
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

async function main() {
  const token = getTmdbToken();
  const filePath = path.resolve(process.cwd(), 'data', 'tmdb', 'movies_500.json');
  const movies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Processing certifications for ${movies.length} movies...`);

  let verifiedVnCount = 0;
  let unverifiedVnCount = 0;
  const vnDistribution: Record<string, number> = {};

  const concurrency = 15;
  let index = 0;

  async function worker() {
    while (index < movies.length) {
      const i = index++;
      const m = movies[i];
      try {
        const url = `https://api.themoviedb.org/3/movie/${m.tmdb_id}/release_dates`;
        const res: ReleaseDatesResponse = await fetchWithRetry(url, token, 3);
        const vnCert = extractVnCertification(res?.results || []);
        const originCert = extractOriginCertification(
          res?.results || [],
          m.original_language,
          m.production_countries
        );

        m.age_rating_vi = vnCert; // Official Vietnam rating (or null)
        m.certification_origin = originCert; // Origin country rating (e.g. US: PG-13, KR: 15)

        if (vnCert) {
          verifiedVnCount++;
          vnDistribution[vnCert] = (vnDistribution[vnCert] || 0) + 1;
        } else {
          unverifiedVnCount++;
        }
      } catch (err: any) {
        console.error(`Error for tmdb_id ${m.tmdb_id}:`, err.message);
      }
      if (i % 50 === 0 || i === movies.length - 1) {
        console.log(`Progress: ${i + 1}/${movies.length} checked.`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Write updated movies_500.json
  fs.writeFileSync(filePath, JSON.stringify(movies, null, 2), 'utf8');

  console.log('\n--- CERTIFICATION REFINEMENT SUMMARY ---');
  console.log(`Total Movies: ${movies.length}`);
  console.log(`Official Vietnam Certified: ${verifiedVnCount}`);
  console.log(`Unverified in Vietnam (null/TBC): ${unverifiedVnCount}`);
  console.log('Vietnam Distribution:', vnDistribution);

  const sampleUnverified = movies.filter((m: any) => !m.age_rating_vi).slice(0, 5);
  console.log('\nSample Unverified in Vietnam:');
  sampleUnverified.forEach((m: any) => {
    console.log(`- [${m.tmdb_id}] ${m.title} | Origin Cert: ${m.certification_origin || 'None'} | age_rating_vi: ${m.age_rating_vi}`);
  });
}

main().catch(console.error);

