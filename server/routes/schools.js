const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { searchSchools } = require('../services/searchService');

// GET /api/schools/stats — live counts for homepage
router.get('/stats', async (req, res) => {
  try {
    // Count schools that have at least one approved submission
    const { data: approvedSubs } = await supabase
      .from('submissions')
      .select('school_id')
      .eq('status', 'approved')
      .not('school_id', 'is', null);

    const schoolIds = [...new Set((approvedSubs || []).map(s => s.school_id))];

    // Count total approved submissions
    const { count: submissionCount } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    res.json({
      schools: schoolIds.length,
      submissions: submissionCount || 0,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/schools/browse — all schools with approved submissions + averages
router.get('/browse', async (req, res) => {
  try {
    const teacherPositions = ['classroom_teacher', 'teacher_additional_responsibilities', 'middle_leader'];

    // Get all approved submissions with salary data
    const { data: approvedSubs, error: subErr } = await supabase
      .from('submissions')
      .select('school_id, position, gross_usd, gross_gbp, gross_eur, gross_local, local_currency_code')
      .eq('status', 'approved')
      .not('school_id', 'is', null);

    if (subErr) throw subErr;

    const schoolIds = [...new Set((approvedSubs || []).map(s => s.school_id))];
    if (schoolIds.length === 0) return res.json([]);

    // Get schools with country info
    const { data: schools, error: schErr } = await supabase
      .from('schools')
      .select('id, name, country_id, countries(name)')
      .in('id', schoolIds)
      .order('name');

    if (schErr) throw schErr;

    // Group submissions by school and compute averages
    const subsBySchool = {};
    for (const sub of approvedSubs) {
      if (!subsBySchool[sub.school_id]) subsBySchool[sub.school_id] = [];
      subsBySchool[sub.school_id].push(sub);
    }

    const result = schools.map(school => {
      const subs = (subsBySchool[school.id] || []).filter(s => teacherPositions.includes(s.position));
      let averages = null;
      if (subs.length > 0) {
        const sum = subs.reduce((acc, s) => ({
          usd: acc.usd + Number(s.gross_usd || 0),
          gbp: acc.gbp + Number(s.gross_gbp || 0),
          eur: acc.eur + Number(s.gross_eur || 0),
          local: acc.local + Number(s.gross_local || 0),
        }), { usd: 0, gbp: 0, eur: 0, local: 0 });
        const count = subs.length;
        averages = {
          usd: Math.round(sum.usd / count),
          gbp: Math.round(sum.gbp / count),
          eur: Math.round(sum.eur / count),
          local: Math.round(sum.local / count),
          local_currency_code: subs[0].local_currency_code,
        };
      }
      return { ...school, averages };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching browse schools:', err);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// GET /api/schools/search?q=&limit=15
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 15 } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const results = await searchSchools(q.trim(), parseInt(limit));
    res.json(results);
  } catch (err) {
    console.error('Error searching schools:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/schools/:schoolId
router.get('/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: school, error } = await supabase
      .from('schools')
      .select('id, name, country_id, is_user_submitted, countries(name, currency_code, currency_name)')
      .eq('id', schoolId)
      .single();

    if (error || !school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Calculate average gross for teachers (excluding senior leadership)
    const teacherPositions = ['classroom_teacher', 'teacher_additional_responsibilities', 'middle_leader'];
    const { data: avgData } = await supabase
      .from('submissions')
      .select('gross_usd, gross_gbp, gross_eur, gross_local, local_currency_code')
      .eq('school_id', schoolId)
      .eq('status', 'approved')
      .in('position', teacherPositions);

    let averages = null;
    if (avgData && avgData.length > 0) {
      const sum = avgData.reduce((acc, s) => ({
        usd: acc.usd + Number(s.gross_usd || 0),
        gbp: acc.gbp + Number(s.gross_gbp || 0),
        eur: acc.eur + Number(s.gross_eur || 0),
        local: acc.local + Number(s.gross_local || 0),
      }), { usd: 0, gbp: 0, eur: 0, local: 0 });

      const count = avgData.length;
      averages = {
        usd: Math.round(sum.usd / count),
        gbp: Math.round(sum.gbp / count),
        eur: Math.round(sum.eur / count),
        local: Math.round(sum.local / count),
        local_currency_code: avgData[0].local_currency_code,
        count,
      };
    }

    res.json({ ...school, averages });
  } catch (err) {
    console.error('Error fetching school:', err);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// GET /api/schools/:schoolId/submissions
router.get('/:schoolId/submissions', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const positionOrder = [
      'classroom_teacher',
      'teacher_additional_responsibilities',
      'middle_leader',
      'senior_leader_other',
      'senior_leader_head',
    ];

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    // Sort by position rank
    const sorted = (data || []).sort((a, b) => {
      return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });

    res.json(sorted);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
