import fs from 'fs';
import path from 'path';

function getTmdbToken(): string {
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

async function testConnection() {
  try {
    const token = getTmdbToken();
    console.log('[TMDB] Token loaded successfully (length:', token.length, 'chars). Testing connection...');

    const res = await fetch('https://api.themoviedb.org/3/authentication', {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });

    const data = await res.json() as { success?: boolean; status_message?: string; status_code?: number };
    if (res.ok && data.success) {
      console.log('✅ TMDB Authentication SUCCESSFUL!');
      console.log('   Status Code:', res.status);
      console.log('   Message:', data.status_message || 'Success');

      // Also fetch configuration for image base URLs
      const configRes = await fetch('https://api.themoviedb.org/3/configuration', {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });
      const configData = await configRes.json() as any;
      console.log('✅ TMDB Image Configuration loaded:');
      console.log('   Base URL:', configData.images?.secure_base_url || configData.images?.base_url);
      console.log('   Poster sizes:', configData.images?.poster_sizes?.join(', '));
      console.log('   Backdrop sizes:', configData.images?.backdrop_sizes?.join(', '));
    } else {
      console.error('❌ TMDB Authentication FAILED:', res.status, data.status_message);
    }
  } catch (err: any) {
    console.error('❌ Error during TMDB test:', err.message);
  }
}

testConnection();

