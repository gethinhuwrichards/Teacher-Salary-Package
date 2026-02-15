require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');

const TOKEN_MAP = {
  'int': 'international',
  'intl': 'international',
  'st': 'saint',
  'sch': 'school',
  'acad': 'academy',
  'brit': 'british',
  'amer': 'american',
  'prep': 'preparatory',
};

function normalizeName(name) {
  let s = name.toLowerCase();
  s = s.replace(/[''`]/g, '');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.split(' ').map(word => TOKEN_MAP[word] || word).join(' ');
  return s;
}

async function seed() {
  const currenciesPath = path.join(__dirname, '../../data/country_currencies.json');
  const schoolsPath = path.join(__dirname, '../../data/international_schools_list.txt');

  const currencies = JSON.parse(fs.readFileSync(currenciesPath, 'utf-8'));
  const schoolsText = fs.readFileSync(schoolsPath, 'utf-8');

  // Parse the schools file
  const lines = schoolsText.split('\n');
  const countrySchools = {};
  let currentCountry = null;

  for (const line of lines) {
    const countryMatch = line.match(/^--- (.+?) \(\d+ schools?\) ---$/);
    if (countryMatch) {
      currentCountry = countryMatch[1];
      countrySchools[currentCountry] = [];
      continue;
    }
    if (currentCountry && line.trim() && !line.startsWith('=') && !line.startsWith('INTERNATIONAL') && !line.startsWith('Sources:') && !line.startsWith('  1.') && !line.startsWith('  2.') && !line.startsWith('  3.') && !line.startsWith('Updated:') && !line.startsWith('Total:') && !line.startsWith('TOTAL:')) {
      const schoolName = line.trim();
      if (schoolName) {
        countrySchools[currentCountry].push(schoolName);
      }
    }
  }

  console.log(`Parsed ${Object.keys(countrySchools).length} countries`);

  // Insert countries
  const countryRows = [];
  for (const [name, currency] of Object.entries(currencies)) {
    countryRows.push({
      name,
      currency_code: currency.code,
      currency_name: currency.name,
    });
  }

  console.log(`Inserting ${countryRows.length} countries...`);
  const { data: insertedCountries, error: countryError } = await supabase
    .from('countries')
    .upsert(countryRows, { onConflict: 'name' })
    .select();

  if (countryError) {
    console.error('Error inserting countries:', countryError);
    return;
  }
  console.log(`Inserted ${insertedCountries.length} countries`);

  // Build country name→id map
  const countryMap = {};
  for (const c of insertedCountries) {
    countryMap[c.name] = c.id;
  }

  // Insert schools in batches
  const schoolRows = [];
  let totalSchools = 0;
  for (const [country, schools] of Object.entries(countrySchools)) {
    const countryId = countryMap[country];
    if (!countryId) {
      console.warn(`Warning: No country match for "${country}"`);
      continue;
    }
    for (const schoolName of schools) {
      schoolRows.push({
        name: schoolName,
        name_normalized: normalizeName(schoolName),
        country_id: countryId,
        is_user_submitted: false,
      });
      totalSchools++;
    }
  }

  console.log(`Inserting ${totalSchools} schools in batches...`);
  const BATCH_SIZE = 200;
  for (let i = 0; i < schoolRows.length; i += BATCH_SIZE) {
    const batch = schoolRows.slice(i, i + BATCH_SIZE);
    const { error: schoolError } = await supabase
      .from('schools')
      .upsert(batch, { onConflict: 'name,country_id' });

    if (schoolError) {
      console.error(`Error inserting schools batch ${i / BATCH_SIZE + 1}:`, schoolError);
      return;
    }
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(schoolRows.length / BATCH_SIZE)} inserted`);
  }

  console.log(`\nSeed complete: ${insertedCountries.length} countries, ${totalSchools} schools`);
}

seed().catch(console.error);
