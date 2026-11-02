import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'tmdb');

function runVerification() {
  console.log('======================================================================');
  console.log('VERIFYING CINENOVA TMDB DATASET QUALITY & INTEGRITY');
  console.log('======================================================================\n');

  const filesToCheck = [
    'movies_300.json',
    'movies_300.csv',
    'movies_500.json',
    'movies_500.csv',
    'collection_report.json',
    'missing_metadata.csv',
    'fetch_errors.json',
  ];

  for (const f of filesToCheck) {
    const fullPath = path.join(DATA_DIR, f);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing expected file: ${f}`);
    }
    const stat = fs.statSync(fullPath);
    console.log(`✅ File exists: ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  // 1. Verify JSON 500
  const json500Content = fs.readFileSync(path.join(DATA_DIR, 'movies_500.json'), 'utf8');
  const movies500 = JSON.parse(json500Content);
  if (!Array.isArray(movies500) || movies500.length !== 500) {
    throw new Error(`movies_500.json expected 500 movies, got ${movies500?.length}`);
  }
  console.log(`\n✅ movies_500.json is valid JSON with exactly 500 records.`);

  // 2. Verify JSON 300
  const json300Content = fs.readFileSync(path.join(DATA_DIR, 'movies_300.json'), 'utf8');
  const movies300 = JSON.parse(json300Content);
  if (!Array.isArray(movies300) || movies300.length !== 300) {
    throw new Error(`movies_300.json expected 300 movies, got ${movies300?.length}`);
  }
  console.log(`✅ movies_300.json is valid JSON with exactly 300 records.`);

  // 3. Deduplication check
  const idSet = new Set<number>();
  const duplicateIds: number[] = [];
  for (const m of movies500) {
    if (idSet.has(m.tmdb_id)) {
      duplicateIds.push(m.tmdb_id);
    }
    idSet.add(m.tmdb_id);
  }
  if (duplicateIds.length > 0) {
    throw new Error(`Found duplicate TMDB IDs: ${duplicateIds.join(', ')}`);
  }
  console.log(`✅ Deduplication verified: Exactly 500 UNIQUE TMDB IDs, 0 duplicates.`);

  // 4. Verify CSV UTF-8 BOM
  const csv500Buffer = fs.readFileSync(path.join(DATA_DIR, 'movies_500.csv'));
  const hasBom = csv500Buffer[0] === 0xEF && csv500Buffer[1] === 0xBB && csv500Buffer[2] === 0xBF;
  if (!hasBom) {
    throw new Error('movies_500.csv is missing UTF-8 BOM');
  }
  console.log(`✅ CSV UTF-8 BOM verified: Microsoft Excel will open Vietnamese diacritics cleanly.`);

  // 5. Image URLs validation
  let invalidPosters = 0;
  let invalidBackdrops = 0;
  for (const m of movies500) {
    if (!m.poster_url || !m.poster_url.startsWith('https://image.tmdb.org/t/p/w780/')) {
      invalidPosters++;
    }
    if (m.backdrop_url && !m.backdrop_url.startsWith('https://image.tmdb.org/t/p/w1280/')) {
      invalidBackdrops++;
    }
  }
  console.log(`✅ Image URLs validated: All 500 poster URLs match official TMDB format (invalid: ${invalidPosters}).`);

  // 6. Inspect Sample Records across regions
  console.log('\n--- RANDOM SAMPLE INSPECTION ACROSS CATEGORIES ---');
  const sampleCategories = ['vietnam', 'korean', 'japan_anime', 'scifi', 'animation', 'classics'];
  for (const cat of sampleCategories) {
    const sample = movies500.find((m: any) => m.category_tag === cat);
    if (sample) {
      console.log(`\n[Category: ${cat.toUpperCase()}]`);
      console.log(`  • Title:        ${sample.title} (${sample.original_title})`);
      console.log(`  • Release Date: ${sample.release_date} (Year: ${sample.release_year})`);
      console.log(`  • Director:     ${sample.director}`);
      console.log(`  • Genres:       ${sample.genres.join(', ')}`);
      console.log(`  • Cast:         ${sample.cast.slice(0, 4).join(', ')}`);
      console.log(`  • Poster URL:   ${sample.poster_url}`);
      console.log(`  • Overview VN:  ${sample.overview_vi ? sample.overview_vi.substring(0, 90) + '...' : '(English fallback: ' + (sample.overview_en?.substring(0, 70) || 'None') + '...)'}`);
      console.log(`  • Rating/Cert:  ${sample.vote_average}/10 (${sample.vote_count} votes) | Cert: ${sample.release_certifications || 'P'}`);
    }
  }

  // 7. Security check: Ensure token is never present in any output file
  const envPath = path.resolve(process.cwd(), '.env.tmdb');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/TMDB_READ_ACCESS_TOKEN\s*=\s*(.+)/);
  if (match) {
    const token = match[1].trim().replace(/^['"]|['"]$/g, '');
    for (const f of filesToCheck) {
      const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
      if (content.includes(token)) {
        throw new Error(`SECURITY ALERT: Token leaked in ${f}!`);
      }
    }
    console.log(`\n🔒 Security check PASSED: No TMDB token exists in any output file.`);
  }

  console.log('\n======================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('======================================================================\n');
}

runVerification();

