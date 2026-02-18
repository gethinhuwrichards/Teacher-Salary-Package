const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { convertAmount } = require('../services/conversionService');

const VALID_POSITIONS = [
  'classroom_teacher',
  'teacher_additional_responsibilities',
  'middle_leader',
  'senior_leader_other',
  'senior_leader_head',
];

const VALID_ACCOMMODATION = ['allowance', 'provided_furnished', 'provided_unfurnished', 'not_provided'];

// POST /api/submissions
router.post('/', async (req, res) => {
  try {
    const {
      school_id,
      new_school_name,
      new_school_country,
      position,
      gross_pay,
      gross_currency,
      accommodation_type,
      accommodation_allowance,
      accommodation_currency,
      net_pay,
      net_currency,
      tax_not_applicable,
      pension_offered,
      pension_percentage,
      child_places,
      child_places_detail,
      medical_insurance,
      medical_insurance_detail,
    } = req.body;

    // Validation
    if (!position || !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({ error: 'Invalid position' });
    }
    if (!gross_pay || !gross_currency) {
      return res.status(400).json({ error: 'Gross pay and currency are required' });
    }
    if (!accommodation_type || !VALID_ACCOMMODATION.includes(accommodation_type)) {
      return res.status(400).json({ error: 'Invalid accommodation type' });
    }
    if (!school_id && !new_school_name) {
      return res.status(400).json({ error: 'School is required' });
    }

    // Get local currency code for the school's country
    let localCurrencyCode = null;
    if (school_id) {
      const { data: school } = await supabase
        .from('schools')
        .select('country_id, countries(currency_code)')
        .eq('id', school_id)
        .single();
      if (school) {
        localCurrencyCode = school.countries.currency_code;
      }
    } else if (new_school_country) {
      const { data: country } = await supabase
        .from('countries')
        .select('currency_code')
        .eq('name', new_school_country)
        .single();
      if (country) {
        localCurrencyCode = country.currency_code;
      }
    }

    if (!localCurrencyCode) localCurrencyCode = 'USD';

    // Convert gross pay
    const grossConverted = await convertAmount(Number(gross_pay), gross_currency, localCurrencyCode);

    // Build submission record
    const submission = {
      school_id: school_id || null,
      new_school_name: school_id ? null : new_school_name,
      new_school_country: school_id ? null : new_school_country,
      position,
      gross_pay: Number(gross_pay),
      gross_currency,
      gross_usd: grossConverted.usd,
      gross_gbp: grossConverted.gbp,
      gross_eur: grossConverted.eur,
      gross_local: grossConverted.local,
      local_currency_code: localCurrencyCode,
      accommodation_type,
      tax_not_applicable: tax_not_applicable || false,
      pension_offered: pension_offered || false,
      pension_percentage: pension_percentage ? Number(pension_percentage) : null,
      child_places: child_places || null,
      child_places_detail: child_places_detail || null,
      medical_insurance: medical_insurance || false,
      medical_insurance_detail: medical_insurance_detail || null,
      exchange_rate_date: grossConverted.rate_date,
      status: 'pending',
      ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null,
    };

    // Convert accommodation allowance if applicable
    if (accommodation_type === 'allowance' && accommodation_allowance && accommodation_currency) {
      const accomConverted = await convertAmount(Number(accommodation_allowance), accommodation_currency, localCurrencyCode);
      submission.accommodation_allowance = Number(accommodation_allowance);
      submission.accommodation_currency = accommodation_currency;
      submission.accommodation_usd = accomConverted.usd;
      submission.accommodation_gbp = accomConverted.gbp;
      submission.accommodation_eur = accomConverted.eur;
      submission.accommodation_local = accomConverted.local;
    }

    // Convert net pay if provided
    if (net_pay && net_currency) {
      const netConverted = await convertAmount(Number(net_pay), net_currency, localCurrencyCode);
      submission.net_pay = Number(net_pay);
      submission.net_currency = net_currency;
      submission.net_usd = netConverted.usd;
      submission.net_gbp = netConverted.gbp;
      submission.net_eur = netConverted.eur;
      submission.net_local = netConverted.local;
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Submission received and pending review', id: data.id });
  } catch (err) {
    console.error('Error creating submission:', err);
    res.status(500).json({ error: err.message || 'Failed to submit' });
  }
});

module.exports = router;
