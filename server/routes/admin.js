const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const supabase = require('../db/supabase');
const adminAuth = require('../middleware/adminAuth');
const { normalizeQuery } = require('../services/searchService');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }

    // Constant-time comparison
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create session (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .insert({ expires_at: expiresAt })
      .select()
      .single();

    if (error) throw error;
    res.json({ token: session.id, expires_at: session.expires_at });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/submissions?status=pending|denied
router.get('/submissions', adminAuth, async (req, res) => {
  try {
    const status = req.query.status || 'pending';

    const { data, error } = await supabase
      .from('submissions')
      .select('*, schools(name, countries(name))')
      .eq('status', status)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching admin submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PATCH /api/admin/submissions/bulk-status — move approved submissions to pending or denied
router.patch('/submissions/bulk-status', adminAuth, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    if (!['pending', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'status must be pending or denied' });
    }

    const { error } = await supabase
      .from('submissions')
      .update({
        status,
        reviewed_at: status === 'denied' ? new Date().toISOString() : null,
      })
      .in('id', ids);

    if (error) throw error;
    res.json({ message: `${ids.length} submission(s) moved to ${status}` });
  } catch (err) {
    console.error('Error bulk updating submissions:', err);
    res.status(500).json({ error: 'Failed to update submissions' });
  }
});

// PATCH /api/admin/submissions/:id — approve or deny
router.patch('/submissions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    // Get the submission first
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // If approving a new school submission, create the school first
    if (action === 'approve' && !submission.school_id && submission.new_school_name) {
      // Find the country
      const { data: country } = await supabase
        .from('countries')
        .select('id')
        .eq('name', submission.new_school_country)
        .single();

      if (country) {
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: submission.new_school_name,
            name_normalized: normalizeQuery(submission.new_school_name),
            country_id: country.id,
            is_user_submitted: true,
          })
          .select()
          .single();

        if (!schoolError && newSchool) {
          // Link submission to new school
          await supabase
            .from('submissions')
            .update({ school_id: newSchool.id })
            .eq('id', id);
        }
      }
    }

    const { error } = await supabase
      .from('submissions')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: `Submission ${newStatus}` });
  } catch (err) {
    console.error('Error updating submission:', err);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// PATCH /api/admin/submissions/:id/restore — move denied→pending
router.patch('/submissions/:id/restore', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'pending',
        reviewed_at: null,
      })
      .eq('id', id)
      .eq('status', 'denied');

    if (error) throw error;
    res.json({ message: 'Submission restored to pending' });
  } catch (err) {
    console.error('Error restoring submission:', err);
    res.status(500).json({ error: 'Failed to restore submission' });
  }
});

// GET /api/admin/submissions/all — all approved submissions, searchable by school
router.get('/submissions/all', adminAuth, async (req, res) => {
  try {
    const { school_id } = req.query;

    let query = supabase
      .from('submissions')
      .select('*, schools(name, countries(name))')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });

    if (school_id) {
      query = query.eq('school_id', school_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching all submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PATCH /api/admin/submissions/:id/match-school — match new school to existing
router.patch('/submissions/:id/match-school', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.body;

    if (!school_id) {
      return res.status(400).json({ error: 'school_id required' });
    }

    // Verify school exists
    const { data: school } = await supabase
      .from('schools')
      .select('id, name, countries(currency_code)')
      .eq('id', school_id)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const { error } = await supabase
      .from('submissions')
      .update({
        school_id,
        new_school_name: null,
        new_school_country: null,
        local_currency_code: school.countries.currency_code,
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: `Submission matched to ${school.name}` });
  } catch (err) {
    console.error('Error matching school:', err);
    res.status(500).json({ error: 'Failed to match school' });
  }
});

module.exports = router;
