const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { searchSchools } = require('../services/searchService');

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
