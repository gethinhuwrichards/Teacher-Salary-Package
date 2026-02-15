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

export function normalizeQuery(query) {
  let s = query.toLowerCase();
  s = s.replace(/[''`]/g, '');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.split(' ').map(word => TOKEN_MAP[word] || word).join(' ');
  return s;
}
