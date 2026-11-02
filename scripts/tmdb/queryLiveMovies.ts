import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const urlMatch = content.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
  const keyMatch = content.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.+)/);
  if (!urlMatch || !keyMatch) {
    throw new Error('Supabase URL or Publishable Key missing in .env.local');
  }
  return {
    url: urlMatch[1].trim().replace(/^['"]|['"]$/g, ''),
    key: keyMatch[1].trim().replace(/^['"]|['"]$/g, ''),
  };
}

async function queryLiveDatabase() {
  console.log('======================================================================');
  console.log('QUERYING LIVE SUPABASE CLOUD DATABASE (READ-ONLY)');
  console.log('======================================================================\n');

  try {
    const { url, key } = getSupabaseConfig();
    const supabase = createClient(url, key);

    console.log(`Connecting to Supabase: ${url.substring(0, 25)}...`);

    // 1. Query movies
    const { data: movies, error: movieError } = await supabase
      .from('movies')
      .select('id, title, original_title, duration_minutes, release_date, age_rating, rating, status, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (movieError) {
      console.error('❌ Error querying public.movies:', movieError.message);
      return;
    }

    console.log(`✅ Retrieved ${movies.length} live movies from Supabase Cloud:`);
    for (const [idx, m] of movies.entries()) {
      console.log(`   ${idx + 1}. [UUID: ${m.id}] ${m.title} (${m.original_title || 'N/A'})`);
      console.log(`      Status: ${m.status} | Release: ${m.release_date} | Age: ${m.age_rating} | Duration: ${m.duration_minutes}m`);
    }

    // 2. Query showtimes count per movie
    const { data: showtimes, error: stError } = await supabase
      .from('showtimes')
      .select('id, movie_id, starts_at, format, status');

    if (!stError && showtimes) {
      console.log(`\n✅ Retrieved ${showtimes.length} live showtimes across all movies.`);
      const movieShowtimeMap: { [movieId: string]: number } = {};
      for (const st of showtimes) {
        movieShowtimeMap[st.movie_id] = (movieShowtimeMap[st.movie_id] || 0) + 1;
      }
      for (const [mId, count] of Object.entries(movieShowtimeMap)) {
        const m = movies.find((x) => x.id === mId);
        console.log(`   - Movie: ${m?.title || mId} -> ${count} showtimes`);
      }
    }

    // 3. Query bookings count and check 4 demo bookings
    const { data: bookings, error: bkError } = await supabase
      .from('bookings')
      .select('id, booking_code, showtime_id, total_amount, status');

    if (!bkError && bookings) {
      console.log(`\n✅ Verified Live Bookings in Production: ${bookings.length} total bookings.`);
      for (const b of bookings) {
        console.log(`   - Booking: ${b.booking_code} | Status: ${b.status} | Amount: ${b.total_amount}`);
      }
    }

    // Save live database snapshot locally for dry-run reconciliation
    const snapshotPath = path.resolve(process.cwd(), 'data', 'tmdb', 'live_db_movies_snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(movies, null, 2), 'utf8');
    console.log(`\n💾 Live snapshot saved for reconciliation: ${snapshotPath}`);
  } catch (err: any) {
    console.error('❌ Exception querying live database:', err.message);
  }
}

queryLiveDatabase();

