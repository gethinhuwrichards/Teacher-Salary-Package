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

function normalizeQuery(query) {
  let s = query.toLowerCase();
  s = s.replace(/[''`]/g, '');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.split(' ').map(word => TOKEN_MAP[word] || word).join(' ');
  return s;
}

async function searchSchools(query, limit = 15) {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const words = normalized.split(' ').filter(Boolean);
  // Build pattern: %word1%word2%word3%
  const pattern = '%' + words.join('%') + '%';

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, country_id, countries(name)')
    .ilike('name_normalized', pattern)
    .limit(limit);

  if (error) throw error;
  return data;
}

module.exports = { searchSchools, normalizeQuery };
