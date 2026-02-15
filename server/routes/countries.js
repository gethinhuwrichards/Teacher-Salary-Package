const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/countries — countries with approved submissions + school count
router.get('/', async (req, res) => {
  try {
    // Get all school_ids with approved submissions
    const { data: approvedSubs, error: subErr } = await supabase
      .from('submissions')
      .select('school_id')
      .eq('status', 'approved')
      .not('school_id', 'is', null);

    if (subErr) throw subErr;

    const schoolIds = [...new Set((approvedSubs || []).map(s => s.school_id))];

    if (schoolIds.length === 0) {
      return res.json([]);
    }

    // Get those schools with their countries
    const { data: schools, error: schErr } = await supabase
      .from('schools')
      .select('id, country_id')
      .in('id', schoolIds);

    if (schErr) throw schErr;

    // Count schools per country
    const countrySchoolCount = {};
    for (const school of schools) {
      countrySchoolCount[school.country_id] = (countrySchoolCount[school.country_id] || 0) + 1;
    }

    const countryIds = Object.keys(countrySchoolCount).map(Number);
    const { data: countries, error: cErr } = await supabase
      .from('countries')
      .select('id, name, currency_code, currency_name')
      .in('id', countryIds)
      .order('name');

    if (cErr) throw cErr;

    const result = countries.map(c => ({
      ...c,
      school_count: countrySchoolCount[c.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching countries:', err);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/countries/all — all countries (for submit form dropdown)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, currency_code, currency_name')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching all countries:', err);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/countries/:countryId/schools — schools with submissions in a country
router.get('/:countryId/schools', async (req, res) => {
  try {
    const { countryId } = req.params;

    // Get school_ids with approved submissions
    const { data: approvedSubs } = await supabase
      .from('submissions')
      .select('school_id')
      .eq('status', 'approved')
      .not('school_id', 'is', null);

    const schoolIds = [...new Set((approvedSubs || []).map(s => s.school_id))];

    if (schoolIds.length === 0) {
      return res.json([]);
    }

    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, country_id')
      .eq('country_id', countryId)
      .in('id', schoolIds)
      .order('name');

    if (error) throw error;

    // Get average gross for each school (teacher positions only)
    const teacherPositions = ['classroom_teacher', 'teacher_additional_responsibilities', 'middle_leader'];
    const result = [];
    for (const school of schools) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('gross_usd, gross_gbp, gross_eur, gross_local, local_currency_code')
        .eq('school_id', school.id)
        .eq('status', 'approved')
        .in('position', teacherPositions);

      let avg = null;
      if (subs && subs.length > 0) {
        const sum = subs.reduce((acc, s) => ({
          usd: acc.usd + Number(s.gross_usd || 0),
          gbp: acc.gbp + Number(s.gross_gbp || 0),
          eur: acc.eur + Number(s.gross_eur || 0),
          local: acc.local + Number(s.gross_local || 0),
        }), { usd: 0, gbp: 0, eur: 0, local: 0 });

        const count = subs.length;
        avg = {
          usd: Math.round(sum.usd / count),
          gbp: Math.round(sum.gbp / count),
          eur: Math.round(sum.eur / count),
          local: Math.round(sum.local / count),
          local_currency_code: subs[0].local_currency_code,
        };
      }

      result.push({ ...school, averages: avg });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching country schools:', err);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

module.exports = router;
