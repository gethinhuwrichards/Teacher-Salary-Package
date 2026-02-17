/**
 * Import scraped salary data from CSV into the submissions table.
 *
 * Usage:
 *   node server/scripts/import-csv.js
 *
 * Prerequisites:
 *   - .env with SUPABASE_URL, SUPABASE_SERVICE_KEY, EXCHANGE_RATE_API_KEY
 *   - seed.js already run (countries and schools populated)
 *
 * What this script does:
 *   1. Parses the CSV, skipping empty/continuation rows
 *   2. Maps CSV "Salary Currency" names → ISO currency codes
 *   3. Converts monthly salary → annual (×12)
 *   4. Matches school names to existing schools in the database (fuzzy)
 *   5. Converts gross pay to USD/GBP/EUR/local using the conversion service
 *   6. Inserts submissions with status 'approved'
 *   7. Logs unmatched schools and skipped rows for review
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');
const { convertAmount } = require('../services/conversionService');

// ---------- currency name → ISO code mapping ----------
const CURRENCY_NAME_TO_CODE = {
  'us dollar': 'USD',
  'us dollars': 'USD',
  'usd': 'USD',
  'us dollar (next day)': 'USD',
  'euro': 'EUR',
  'euros': 'EUR',
  'pound sterling': 'GBP',
  'british pound': 'GBP',
  'british pound sterling': 'GBP',
  'canadian dollar': 'CAD',
  'australian dollar': 'AUD',
  'new zealand dollar': 'NZD',
  'singapore dollar': 'SGD',
  'hong kong dollar': 'HKD',
  'uae dirham': 'AED',
  'emirati dirham': 'AED',
  'qatari rial': 'QAR',
  'qatari riyal': 'QAR',
  'bahraini dinar': 'BHD',
  'kuwaiti dinar': 'KWD',
  'omani rial': 'OMR',
  'saudi riyal': 'SAR',
  'saudi arabian riyal': 'SAR',
  'jordanian dinar': 'JOD',
  'egyptian pound': 'EGP',
  'south african rand': 'ZAR',
  'rand': 'ZAR',
  'kenyan shilling': 'KES',
  'tanzanian shilling': 'TZS',
  'ugandan shillings & us dollar': 'USD',
  'nigerian naira': 'NGN',
  'ghanaian cedi': 'GHS',
  'moroccan dirham': 'MAD',
  'tunisian dinar': 'TND',
  'chinese yuan': 'CNY',
  'yuan renminbi': 'CNY',
  'rmb': 'CNY',
  'japanese yen': 'JPY',
  'korean won': 'KRW',
  'south korean won': 'KRW',
  'new taiwan dollar': 'TWD',
  'thai baht': 'THB',
  'baht': 'THB',
  'vietnamese dong': 'VND',
  'dong': 'VND',
  'indonesian rupiah': 'IDR',
  'malaysian ringgit': 'MYR',
  'philippine peso': 'PHP',
  'indian rupee': 'INR',
  'pakistani rupee': 'PKR',
  'sri lankan rupee': 'LKR',
  'nepalese rupee': 'NPR',
  'bangladeshi taka': 'BDT',
  'taka': 'BDT',
  'myanmar kyat': 'MMK',
  'cambodian riel': 'KHR',
  'lao kip': 'LAK',
  'brunei dollar': 'BND',
  'mexican peso': 'MXN',
  'colombian peso': 'COP',
  'peruvian sol': 'PEN',
  'chilean peso': 'CLP',
  'argentine peso': 'ARS',
  'brazilian real': 'BRL',
  'uruguayan peso': 'UYU',
  'paraguayan guarani': 'PYG',
  'costa rican colon': 'CRC',
  'jamaican dollar': 'JMD',
  'bahamian dollar': 'BSD',
  'cayman islands dollar': 'KYD',
  'trinidad and tobago dollar': 'TTD',
  'east caribbean dollar': 'XCD',
  'turkish lira': 'TRY',
  'russian ruble': 'RUB',
  'ukrainian hryvnia': 'UAH',
  'polish zloty': 'PLN',
  'czech koruna': 'CZK',
  'hungarian forint': 'HUF',
  'romanian leu': 'RON',
  'serbian dinar': 'RSD',
  'georgian lari': 'GEL',
  'kazakhstani tenge': 'KZT',
  'uzbekistani som': 'UZS',
  'swiss franc': 'CHF',
  'wir franc': 'CHF',
  'swedish krona': 'SEK',
  'norwegian krone': 'NOK',
  'danish krone': 'DKK',
  'israeli new shekel': 'ILS',
  'zambian kwacha': 'ZMW',
  'ethiopian birr': 'ETB',
  'rwandan franc': 'RWF',
  'west african cfa franc': 'XOF',
  'central african cfa franc': 'XAF',
  'mongolian tugrik': 'MNT',
  'panamanian balboa': 'PAB',
};

// ---------- CSV country name → database country name normalization ----------
const COUNTRY_ALIASES = {
  'uae': 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  'uk': 'Great Britain',
  'united kingdom': 'Great Britain',
  'us': 'United States',
  'usa': 'United States',
  'brunei': 'Brunei Darussalam',
  'brunei darussala': 'Brunei Darussalam',
  'brazik': 'Brazil',
  'turkiye': 'Turkey',
  'timor leste': 'East Timor',
  'cayman islands': 'Cayman Island',
  'turks and caicos': 'Turks and Caicos Islands',
  'turks and caicos islands': 'Turks and Caicos Islands',
  'korea': 'Korea',
  'south korea': 'Korea',
  'china': 'China',
  'taiwan': 'Taiwan',
  'qatar': 'Qatar',
};

// ---------- helpers ----------

function parseCSV(text) {
  // Simple CSV parser that handles quoted fields with commas
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
        if (i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseNumber(str) {
  if (!str) return null;
  // Remove commas and whitespace
  const cleaned = str.replace(/,/g, '').replace(/\s/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function resolveCurrencyCode(currencyName) {
  if (!currencyName) return null;
  const key = currencyName.toLowerCase().trim();
  return CURRENCY_NAME_TO_CODE[key] || null;
}

function resolveCountryName(csvCountry, countryMap) {
  if (!csvCountry) return null;
  const trimmed = csvCountry.trim();

  // Direct match
  if (countryMap[trimmed]) return trimmed;

  // Alias match
  const aliasKey = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[aliasKey] && countryMap[COUNTRY_ALIASES[aliasKey]]) {
    return COUNTRY_ALIASES[aliasKey];
  }

  // Case-insensitive match against country names
  for (const name of Object.keys(countryMap)) {
    if (name.toLowerCase() === aliasKey) return name;
  }

  return null;
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

  // Try exact normalized match first
  for (const school of countrySchools) {
    if (school.norm === csvNorm) return school;
  }

  // Try substring match: does the CSV name contain a DB school name or vice versa
  for (const school of countrySchools) {
    if (csvNorm.includes(school.norm) || school.norm.includes(csvNorm)) return school;
  }

  // Try word overlap match — at least 2 significant words match
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

function mapPosition(role, gradeLevel) {
  // The CSV doesn't have clean position tiers, so we default to classroom_teacher
  // and try to detect leadership roles from the text
  const combined = ((role || '') + ' ' + (gradeLevel || '')).toLowerCase();

  if (/\b(head of school|headteacher|head teacher|principal|superintendent|director)\b/.test(combined)) {
    return 'senior_leader_head';
  }
  if (/\b(deputy head|assistant head|vice principal|assistant principal)\b/.test(combined)) {
    return 'senior_leader_other';
  }
  if (/\b(head of department|head of year|phase leader|coordinator|team lead|hod|curriculum lead)\b/.test(combined)) {
    return 'middle_leader';
  }
  if (/\b(leadership|senior|assistant headteacher)\b/.test(combined)) {
    return 'senior_leader_other';
  }
  if (/\b(academic quality controller)\b/.test(combined)) {
    return 'middle_leader';
  }

  return 'classroom_teacher';
}

function detectAccommodation(housingAllowance, additionalBenefits) {
  const housing = parseNumber(housingAllowance);
  const benefits = (additionalBenefits || '').toLowerCase();

  if (housing && housing > 0) {
    return { type: 'allowance', amount: housing };
  }
  if (/housing (is )?(provided|included)|free (housing|accommodation)|accommodation (provided|included)|unfurnished (housing|accommodation)/.test(benefits)) {
    if (/unfurnished/.test(benefits)) return { type: 'provided_unfurnished', amount: null };
    return { type: 'provided_furnished', amount: null };
  }
  return { type: 'not_provided', amount: null };
}

function detectMedical(additionalBenefits) {
  const b = (additionalBenefits || '').toLowerCase();
  if (/medical|health (insurance|care|cover)|insurance|bupa|aetna/.test(b)) {
    return true;
  }
  return false;
}

function detectTaxFree(taxRate) {
  if (!taxRate) return false;
  const t = taxRate.toLowerCase().trim();
  return t === '0' || t === '0%' || t === 'tax free' || t === 'tax-free'
    || t === 'no tax' || t === 'n/a' || t === 'na' || t === 'none'
    || t === 'not applicable' || t === 'tax paid by school'
    || t === 'paid by employer' || t === 'covered by school'
    || t === 'school pays taxes';
}

// ---------- main ----------

async function main() {
  console.log('Loading CSV...');
  const csvPath = path.join(__dirname, '../../scraped data teachersalary.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const allRows = parseCSV(csvText);

  console.log(`Parsed ${allRows.length} CSV rows`);

  // Load countries from DB
  const { data: countries, error: cErr } = await supabase
    .from('countries')
    .select('id, name, currency_code');
  if (cErr) throw cErr;

  const countryMap = {};
  for (const c of countries) {
    countryMap[c.name] = { id: c.id, currency_code: c.currency_code };
  }

  // Load all schools from DB
  const { data: schools, error: sErr } = await supabase
    .from('schools')
    .select('id, name, name_normalized, country_id');
  if (sErr) throw sErr;

  // Group schools by country_id
  const schoolsByCountry = {};
  for (const s of schools) {
    if (!schoolsByCountry[s.country_id]) schoolsByCountry[s.country_id] = [];
    schoolsByCountry[s.country_id].push({
      id: s.id,
      name: s.name,
      norm: s.name_normalized,
    });
  }

  // CSV columns (data rows):
  // 0: row#, 1: Year, 2: Country, 3: City, 4: School Name,
  // 5: (empty), 6: Curriculum, 7: Grade Level, 8: Role, 9: Years of Exp,
  // 10: Salary Convertor(USD), 11: (empty), 12: Salary Currency, 13: Monthly Salary,
  // 14: Savings, 15: Tax Rate, 16: Flights, 17: Housing Allowance,
  // 18: End of Contract, 19: Additional Benefits

  const submissions = [];
  const skipped = [];
  const unmatchedSchools = [];
  let processed = 0;

  for (let i = 2; i < allRows.length; i++) { // skip header rows
    const row = allRows[i];
    if (!row || row.length < 13) continue;

    const rowNum = row[0];
    const year = row[1];
    const csvCountry = row[2];
    const city = row[3];
    const schoolName = row[4];
    const gradeLevel = row[7];
    const role = row[8];
    const salaryCurrency = row[12];
    const monthlySalary = row[13];
    const taxRate = row[15];
    const housingAllowance = row[17];
    const endOfContract = row[18];
    const additionalBenefits = row[19];

    // Skip empty/continuation rows (no year means it's a continuation)
    if (!year || !year.match(/^20\d\d$/)) continue;
    if (!schoolName || schoolName.trim() === '') continue;
    if (!monthlySalary) continue;

    const monthly = parseNumber(monthlySalary);
    if (!monthly || monthly <= 0) continue;

    // Resolve currency
    const currencyCode = resolveCurrencyCode(salaryCurrency);
    if (!currencyCode) {
      skipped.push({ row: i + 1, reason: `Unknown currency: "${salaryCurrency}"`, school: schoolName });
      continue;
    }

    // Resolve country
    const dbCountryName = resolveCountryName(csvCountry, countryMap);
    if (!dbCountryName) {
      skipped.push({ row: i + 1, reason: `Unknown country: "${csvCountry}"`, school: schoolName });
      continue;
    }
    const countryInfo = countryMap[dbCountryName];

    // Match school
    const countrySchools = schoolsByCountry[countryInfo.id] || [];
    const matchedSchool = matchSchool(schoolName, countrySchools);

    if (!matchedSchool) {
      unmatchedSchools.push({
        row: i + 1,
        csvName: schoolName,
        country: dbCountryName,
        city: city,
      });
      continue;
    }

    // Convert monthly → annual
    const annualGross = Math.round(monthly * 12 * 100) / 100;
    const position = mapPosition(role, gradeLevel);
    const accommodation = detectAccommodation(housingAllowance, additionalBenefits);
    const hasMedical = detectMedical(additionalBenefits);
    const taxFree = detectTaxFree(taxRate);

    // Build a submitted_at date from the year
    const submittedAt = `${year}-06-15T00:00:00Z`;

    // Convert amounts
    let grossConverted;
    try {
      grossConverted = await convertAmount(annualGross, currencyCode, countryInfo.currency_code);
    } catch (err) {
      skipped.push({ row: i + 1, reason: `Conversion error: ${err.message}`, school: schoolName });
      continue;
    }

    const submission = {
      school_id: matchedSchool.id,
      position,
      gross_pay: annualGross,
      gross_currency: currencyCode,
      gross_usd: grossConverted.usd,
      gross_gbp: grossConverted.gbp,
      gross_eur: grossConverted.eur,
      gross_local: grossConverted.local,
      local_currency_code: countryInfo.currency_code,
      accommodation_type: accommodation.type,
      tax_not_applicable: taxFree,
      pension_offered: false,
      medical_insurance: hasMedical,
      status: 'pending',
      submitted_at: submittedAt,
      exchange_rate_date: grossConverted.rate_date,
    };

    // Handle housing allowance conversion
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
        // If housing conversion fails, just skip it
        submission.accommodation_type = 'not_provided';
      }
    }

    submissions.push(submission);
    processed++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Rows processed: ${processed}`);
  console.log(`Submissions to insert: ${submissions.length}`);
  console.log(`Skipped (bad data): ${skipped.length}`);
  console.log(`Unmatched schools: ${unmatchedSchools.length}`);

  if (skipped.length > 0) {
    console.log(`\n--- Skipped rows ---`);
    for (const s of skipped) {
      console.log(`  Row ${s.row}: ${s.reason} (${s.school})`);
    }
  }

  if (unmatchedSchools.length > 0) {
    console.log(`\n--- Unmatched schools (not in database) ---`);
    for (const s of unmatchedSchools) {
      console.log(`  Row ${s.row}: "${s.csvName}" in ${s.country} (${s.city})`);
    }
  }

  if (submissions.length === 0) {
    console.log('\nNo submissions to insert. Exiting.');
    return;
  }

  // Insert in batches
  console.log(`\nInserting ${submissions.length} submissions in batches...`);
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
    const batch = submissions.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('submissions')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      continue;
    }
    inserted += batch.length;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(submissions.length / BATCH_SIZE)} — ${inserted}/${submissions.length}`);
  }

  console.log(`\nDone! Inserted ${inserted} submissions.`);
}

main().catch(console.error);
