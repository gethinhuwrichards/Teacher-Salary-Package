/**
 * TEST RUN — imports only 3 schools from the CSV to verify the pipeline works.
 * Schools: World Academy of Tirana, Amadeus International School, British School of Bahrain
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');
const { convertAmount } = require('../services/conversionService');

// Only process these 3 schools (CSV row numbers in column A)
const TEST_ROWS = new Set(['2', '8', '17']);

// --- currency name → ISO code ---
const CURRENCY_NAME_TO_CODE = {
  'us dollar': 'USD',
  'euro': 'EUR',
  'pound sterling': 'GBP',
  'bahraini dinar': 'BHD',
};

const COUNTRY_ALIASES = {};

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = text.split('\n');
  for (const line of lines) {
    if (inQuotes) {
      current += '\n' + line;
      if ((line.match(/"/g) || []).length % 2 === 1) {
        inQuotes = false;
        rows.push(parseCSVRow(current));
        current = '';
      }
    } else {
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inQuotes = true;
        current = line;
      } else {
        rows.push(parseCSVRow(line));
      }
    }
  }
  return rows;
}

function parseCSVRow(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { fields.push(field.trim()); field = ''; }
      else field += ch;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseNumber(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/,/g, '').trim());
  return isNaN(num) ? null : num;
}

function normalizeSchoolName(name) {
  let s = name.toLowerCase();
  s = s.replace(/[''`]/g, '');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function matchSchool(csvSchoolName, countrySchools) {
  if (!countrySchools || countrySchools.length === 0) return null;
  const csvNorm = normalizeSchoolName(csvSchoolName);
  for (const school of countrySchools) {
    if (school.norm === csvNorm) return school;
  }
  for (const school of countrySchools) {
    if (csvNorm.includes(school.norm) || school.norm.includes(csvNorm)) return school;
  }
  const csvWords = csvNorm.split(' ').filter(w => w.length > 2);
  let bestMatch = null;
  let bestOverlap = 0;
  for (const school of countrySchools) {
    const dbWords = school.norm.split(' ').filter(w => w.length > 2);
    const overlap = csvWords.filter(w => dbWords.includes(w)).length;
    const ratio = overlap / Math.max(csvWords.length, dbWords.length);
    if (overlap >= 2 && ratio > 0.5 && overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = school;
    }
  }
  return bestMatch;
}

function detectAccommodation(housingAllowance, additionalBenefits) {
  const housing = parseNumber(housingAllowance);
  const benefits = (additionalBenefits || '').toLowerCase();
  if (housing && housing > 0) return { type: 'allowance', amount: housing };
  if (/housing (is )?(provided|included)|free (housing|accommodation)/.test(benefits)) {
    if (/unfurnished/.test(benefits)) return { type: 'provided_unfurnished', amount: null };
    return { type: 'provided_furnished', amount: null };
  }
  return { type: 'not_provided', amount: null };
}

function detectTaxFree(taxRate) {
  if (!taxRate) return false;
  const t = taxRate.toLowerCase().trim();
  return t === '0' || t === '0%' || t === 'tax free' || t === 'no tax' || t === 'n/a' || t === 'na' || t === 'none';
}

function detectMedical(additionalBenefits) {
  const b = (additionalBenefits || '').toLowerCase();
  return /medical|health (insurance|care|cover)|insurance/.test(b);
}

async function main() {
  console.log('=== TEST RUN — 3 schools only ===\n');

  const csvPath = path.join(__dirname, '../../scraped data teachersalary.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const allRows = parseCSV(csvText);

  const { data: countries } = await supabase.from('countries').select('id, name, currency_code');
  const countryMap = {};
  for (const c of countries) countryMap[c.name] = { id: c.id, currency_code: c.currency_code };

  const { data: schools } = await supabase.from('schools').select('id, name, name_normalized, country_id');
  const schoolsByCountry = {};
  for (const s of schools) {
    if (!schoolsByCountry[s.country_id]) schoolsByCountry[s.country_id] = [];
    schoolsByCountry[s.country_id].push({ id: s.id, name: s.name, norm: s.name_normalized });
  }

  const submissions = [];

  for (let i = 2; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || row.length < 14) continue;

    const rowNum = row[0];
    if (!TEST_ROWS.has(rowNum)) continue;

    const year = row[1];
    const csvCountry = row[2];
    const schoolName = row[4];
    const role = row[8];
    const salaryCurrency = row[12];
    const monthlySalary = row[13];
    const taxRate = row[15];
    const housingAllowance = row[17];
    const additionalBenefits = row[19];

    console.log(`--- Row ${rowNum}: ${schoolName} (${csvCountry}) ---`);
    console.log(`  Currency: "${salaryCurrency}" → ${CURRENCY_NAME_TO_CODE[salaryCurrency?.toLowerCase().trim()] || '???'}`);
    console.log(`  Monthly salary: ${monthlySalary}`);

    const monthly = parseNumber(monthlySalary);
    if (!monthly) { console.log('  SKIP: bad salary'); continue; }

    const currencyCode = CURRENCY_NAME_TO_CODE[salaryCurrency?.toLowerCase().trim()];
    if (!currencyCode) { console.log(`  SKIP: unknown currency`); continue; }

    // Find country
    let dbCountryName = null;
    for (const name of Object.keys(countryMap)) {
      if (name.toLowerCase() === csvCountry.toLowerCase().trim()) { dbCountryName = name; break; }
    }
    if (!dbCountryName) { console.log(`  SKIP: unknown country`); continue; }
    const countryInfo = countryMap[dbCountryName];
    console.log(`  Country: "${csvCountry}" → ${dbCountryName} (id=${countryInfo.id}, local=${countryInfo.currency_code})`);

    // Match school
    const countrySchools = schoolsByCountry[countryInfo.id] || [];
    const matched = matchSchool(schoolName, countrySchools);
    if (!matched) {
      console.log(`  SKIP: no school match found (${countrySchools.length} schools in country)`);
      continue;
    }
    console.log(`  School match: "${schoolName}" → "${matched.name}" (id=${matched.id})`);

    const annualGross = Math.round(monthly * 12 * 100) / 100;
    console.log(`  Annual gross: ${annualGross} ${currencyCode}`);

    const accommodation = detectAccommodation(housingAllowance, additionalBenefits);
    console.log(`  Accommodation: ${accommodation.type}${accommodation.amount ? ' (' + accommodation.amount + '/mo)' : ''}`);
    console.log(`  Tax free: ${detectTaxFree(taxRate)}`);
    console.log(`  Medical: ${detectMedical(additionalBenefits)}`);

    let grossConverted;
    try {
      grossConverted = await convertAmount(annualGross, currencyCode, countryInfo.currency_code);
    } catch (err) {
      console.log(`  SKIP: conversion error — ${err.message}`);
      continue;
    }
    console.log(`  Converted: USD ${grossConverted.usd} | GBP ${grossConverted.gbp} | EUR ${grossConverted.eur} | Local ${grossConverted.local}`);

    const submission = {
      school_id: matched.id,
      position: 'classroom_teacher',
      gross_pay: annualGross,
      gross_currency: currencyCode,
      gross_usd: grossConverted.usd,
      gross_gbp: grossConverted.gbp,
      gross_eur: grossConverted.eur,
      gross_local: grossConverted.local,
      local_currency_code: countryInfo.currency_code,
      accommodation_type: accommodation.type,
      tax_not_applicable: detectTaxFree(taxRate),
      pension_offered: false,
      medical_insurance: detectMedical(additionalBenefits),
      status: 'pending',
      submitted_at: `${year}-06-15T00:00:00Z`,
      exchange_rate_date: grossConverted.rate_date,
    };

    if (accommodation.type === 'allowance' && accommodation.amount) {
      try {
        const annualHousing = Math.round(accommodation.amount * 12 * 100) / 100;
        const housingConverted = await convertAmount(annualHousing, currencyCode, countryInfo.currency_code);
        submission.accommodation_allowance = annualHousing;
        submission.accommodation_currency = currencyCode;
        submission.accommodation_usd = housingConverted.usd;
        submission.accommodation_gbp = housingConverted.gbp;
        submission.accommodation_eur = housingConverted.eur;
        submission.accommodation_local = housingConverted.local;
      } catch (err) {
        submission.accommodation_type = 'not_provided';
      }
    }

    submissions.push(submission);
    console.log('  ✓ Ready to insert\n');
  }

  console.log(`\n=== ${submissions.length}/3 submissions ready ===\n`);

  if (submissions.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // DRY RUN — show what would be inserted, then ask
  console.log('Inserting into Supabase...');
  const { data, error } = await supabase
    .from('submissions')
    .insert(submissions)
    .select('id, school_id, gross_pay, gross_currency, status');

  if (error) {
    console.error('Insert error:', error);
    return;
  }

  console.log('Inserted:');
  for (const row of data) {
    console.log(`  id=${row.id} school_id=${row.school_id} gross=${row.gross_pay} ${row.gross_currency} status=${row.status}`);
  }
  console.log('\nDone! Check the admin panel to see them in the review queue.');
}

main().catch(console.error);
