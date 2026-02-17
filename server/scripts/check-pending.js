require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../db/supabase');

async function check() {
  // Check ALL submissions regardless of status
  const { data, error, count } = await supabase
    .from('submissions')
    .select('id, school_id, status, gross_pay, gross_currency, submitted_at, schools(name)', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total submissions in database: ${data.length}`);

  const byStatus = {};
  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
  }
  console.log('By status:', byStatus);

  console.log('\nAll rows:');
  for (const row of data) {
    console.log(`  ${row.id} | ${row.schools?.name || 'no school'} | ${row.gross_pay} ${row.gross_currency} | status=${row.status} | ${row.submitted_at}`);
  }
}

check().catch(console.error);
