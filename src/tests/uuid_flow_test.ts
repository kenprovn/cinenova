import { resolveMovieId, UUID_REGEX, MOCK_TO_REAL_MOVIE_ID } from '../services/movieService';
import { resolveCinemaId, MOCK_TO_REAL_CINEMA_ID } from '../services/cinemaService';
import { resolveShowtimeId } from '../services/showtimeService';

function runTests() {
  console.log('======================================================================');
  console.log('CINENOVA: UUID & LEGACY ALIAS RESOLUTION TEST');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, cond: boolean) {
    total++;
    if (cond) {
      console.log(`✔ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${desc}`);
      process.exitCode = 1;
    }
  }

  // Test 1: Dune: Part Two ("Hành Tinh Cát: Phần Hai") mapping
  const duneUuid = resolveMovieId('m1');
  assert('Legacy "m1" correctly maps to Dune 2 UUID', duneUuid === 'a1000000-0000-0000-0000-000000000001');
  assert('Resolved Dune 2 UUID matches UUID_REGEX', UUID_REGEX.test(duneUuid));

  // Test 2: Oppenheimer mapping
  const oppenheimerUuid = resolveMovieId('m2');
  assert('Legacy "m2" correctly maps to Oppenheimer UUID', oppenheimerUuid === 'a1000000-0000-0000-0000-000000000002');

  // Test 3: Case-insensitive alias resolution
  assert('Case-insensitive "M1" maps to Dune 2 UUID', resolveMovieId('M1') === 'a1000000-0000-0000-0000-000000000001');
  assert('Trimmed " m1  " maps to Dune 2 UUID', resolveMovieId(' m1  ') === 'a1000000-0000-0000-0000-000000000001');

  // Test 4: Already valid UUID stays untouched
  const realUuid = 'a1000000-0000-0000-0000-000000000001';
  assert('Real UUID is preserved untouched by resolveMovieId', resolveMovieId(realUuid) === realUuid);

  // Test 5: Cinema alias resolution
  const landmarkCinemaUuid = resolveCinemaId('c1');
  assert('Legacy cinema "c1" maps to CINENOVA Landmark Sài Gòn UUID', landmarkCinemaUuid === 'c1000000-0000-0000-0000-000000000001');
  assert('Legacy cinema "c2" maps to CINENOVA Tây Hồ Hà Nội UUID', resolveCinemaId('c2') === 'c1000000-0000-0000-0000-000000000002');
  assert('Legacy cinema "c3" maps to CINENOVA Sông Hàn Đà Nẵng UUID', resolveCinemaId('c3') === 'c1000000-0000-0000-0000-000000000003');

  // Test 6: Showtime alias resolution
  assert('Legacy showtime "st1" maps to real UUID', resolveShowtimeId('st1') === 's1000000-0000-0000-0000-000000000001');

  // Test 7: Verify all 10 movies have valid UUID mappings
  for (let i = 1; i <= 10; i++) {
    const key = `m${i}`;
    const uuid = MOCK_TO_REAL_MOVIE_ID[key];
    assert(`Movie alias ${key} maps to valid UUID (${uuid})`, !!uuid && UUID_REGEX.test(uuid));
  }

  // Test 8: Verify all 3 cinemas have valid UUID mappings
  for (let i = 1; i <= 3; i++) {
    const key = `c${i}`;
    const uuid = MOCK_TO_REAL_CINEMA_ID[key];
    assert(`Cinema alias ${key} maps to valid UUID (${uuid})`, !!uuid && UUID_REGEX.test(uuid));
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('----------------------------------------------------------------------');
}

runTests();
