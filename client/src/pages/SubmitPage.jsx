import { useState, useEffect } from 'react';
import { api } from '../api/client';
import SchoolAutocomplete from '../components/SchoolAutocomplete';
import { POSITIONS, ACCOMMODATION_TYPES, CHILD_PLACES_OPTIONS } from '../utils/constants';
import './SubmitPage.css';

export default function SubmitPage() {
  const [countries, setCountries] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCountry, setNewSchoolCountry] = useState('');
  const [localCurrency, setLocalCurrency] = useState(null);

  const [position, setPosition] = useState('');
  const [grossPay, setGrossPay] = useState('');
  const [grossCurrency, setGrossCurrency] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [accommodationAllowance, setAccommodationAllowance] = useState('');

  const [netPay, setNetPay] = useState('');
  const [taxNotApplicable, setTaxNotApplicable] = useState(false);
  const [pensionOffered, setPensionOffered] = useState(false);
  const [pensionPercentage, setPensionPercentage] = useState('');
  const [childPlacesOffered, setChildPlacesOffered] = useState(false);
  const [childPlaces, setChildPlaces] = useState('');
  const [childPlacesDetail, setChildPlacesDetail] = useState('');
  const [medicalInsurance, setMedicalInsurance] = useState(false);
  const [medicalInsuranceDetail, setMedicalInsuranceDetail] = useState('');

  const [showGrossCalc, setShowGrossCalc] = useState(false);
  const [grossMonthly, setGrossMonthly] = useState('');
  const [grossMonths, setGrossMonths] = useState('');

  const [showNetCalc, setShowNetCalc] = useState(false);
  const [netMonthly, setNetMonthly] = useState('');
  const [netMonths, setNetMonths] = useState('');

  const [showLowSalaryWarning, setShowLowSalaryWarning] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAllCountries().then(setCountries).catch(() => {});
    api.getRates().then(data => setExchangeRates(data.rates)).catch(() => {});
  }, []);

  // When school is selected, determine local currency
  useEffect(() => {
    if (selectedSchool?.countries) {
      const country = countries.find(c => c.name === selectedSchool.countries.name);
      if (country) {
        setLocalCurrency(country.currency_code);
        if (!grossCurrency) setGrossCurrency(country.currency_code);
      }
    }
  }, [selectedSchool, countries]);

  // When new school country is selected, determine local currency
  useEffect(() => {
    if (newSchoolCountry) {
      const country = countries.find(c => c.name === newSchoolCountry);
      if (country) {
        setLocalCurrency(country.currency_code);
        if (!grossCurrency) setGrossCurrency(country.currency_code);
      }
    }
  }, [newSchoolCountry, countries]);

  function getCurrencyOptions() {
    const options = ['USD', 'GBP', 'EUR'];
    if (localCurrency && !options.includes(localCurrency)) {
      options.unshift(localCurrency);
    }
    return options;
  }

  const LOW_SALARY_THRESHOLD_USD = 12000;

  function isLowSalary(amount, currency) {
    if (currency === 'USD') return amount < LOW_SALARY_THRESHOLD_USD;
    if (!exchangeRates) return false;
    const rate = exchangeRates[currency];
    if (!rate) return false;
    const usdEquivalent = amount / rate;
    return usdEquivalent < LOW_SALARY_THRESHOLD_USD;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedSchool && !newSchoolName) {
      setError('Please select a school or enter a new school name.');
      return;
    }
    if (!position || !grossPay || !grossCurrency || !accommodationType) {
      setError('Please fill in all required fields.');
      return;
    }
    if (accommodationType === 'allowance' && !accommodationAllowance) {
      setError('Please enter the accommodation allowance amount.');
      return;
    }
    if (netPay && grossPay && parseFloat(netPay) > parseFloat(grossPay)) {
      setError('Net pay cannot be greater than gross pay. Net pay should be your take-home amount after tax.');
      return;
    }

    // Low salary warning — show once, let them confirm
    if (!showLowSalaryWarning && isLowSalary(parseFloat(grossPay), grossCurrency)) {
      setShowLowSalaryWarning(true);
      return;
    }
    setShowLowSalaryWarning(false);

    setSubmitting(true);
    try {
      const data = {
        school_id: selectedSchool?.id || null,
        new_school_name: selectedSchool ? null : newSchoolName,
        new_school_country: selectedSchool ? null : newSchoolCountry,
        position,
        gross_pay: parseFloat(grossPay),
        gross_currency: grossCurrency,
        accommodation_type: accommodationType,
      };

      if (accommodationType === 'allowance' && accommodationAllowance) {
        data.accommodation_allowance = parseFloat(accommodationAllowance);
        data.accommodation_currency = grossCurrency;
      }

      if (netPay) {
        data.net_pay = parseFloat(netPay);
        data.net_currency = grossCurrency;
      }

      data.tax_not_applicable = taxNotApplicable;
      data.pension_offered = pensionOffered;
      if (pensionOffered && pensionPercentage) {
        data.pension_percentage = parseFloat(pensionPercentage);
      }
      if (childPlaces) data.child_places = childPlaces;
      if (childPlacesDetail) data.child_places_detail = childPlacesDetail;
      data.medical_insurance = medicalInsurance;
      if (medicalInsuranceDetail) data.medical_insurance_detail = medicalInsuranceDetail;

      await api.submitSalary(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="submit-page">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Thank You!</h2>
          <p>Your salary submission has been received and is pending review. Once approved, it will appear on the school's page.</p>
        </div>
      </div>
    );
  }

  const currencyOptions = getCurrencyOptions();

  return (
    <div className="submit-page">
      <h1>Submit Your Salary</h1>
      <p className="page-subtitle">All submissions are anonymous and reviewed before publishing.</p>

      <form onSubmit={handleSubmit} className="submit-form">
        {/* School */}
        <section className="form-section">
          <h2>School</h2>
          <SchoolAutocomplete
            onSelect={(school) => setSelectedSchool(school)}
            onNewSchool={(name) => setNewSchoolName(name)}
          />
          {!selectedSchool && newSchoolName && (
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Country *</label>
              <select
                className="form-select"
                value={newSchoolCountry}
                onChange={(e) => setNewSchoolCountry(e.target.value)}
              >
                <option value="">Select country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Position */}
        <section className="form-section">
          <h2>Position</h2>
          <div className="form-group">
            <label className="form-label">Position Level *</label>
            <select className="form-select" value={position} onChange={(e) => setPosition(e.target.value)}>
              <option value="">Select position...</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Gross Pay */}
        <section className="form-section">
          <h2>Gross Pay</h2>
          <div className="form-row">
            <div className="form-group flex-grow">
              <label className="form-label">Annual Gross Pay *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 45000"
                value={grossPay}
                onChange={(e) => { setGrossPay(e.target.value); setShowLowSalaryWarning(false); }}
              />
            </div>
            <div className="form-group" style={{ minWidth: '120px' }}>
              <label className="form-label">Currency *</label>
              <select className="form-select" value={grossCurrency} onChange={(e) => setGrossCurrency(e.target.value)}>
                <option value="">Select...</option>
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {!showGrossCalc ? (
            <button type="button" className="help-calc-btn" onClick={() => setShowGrossCalc(true)}>
              Help calculating
            </button>
          ) : (
            <div className="calc-box">
              <div className="form-row">
                <div className="form-group flex-grow">
                  <label className="form-label">Total pay per month</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3750"
                    value={grossMonthly}
                    onChange={(e) => setGrossMonthly(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ minWidth: '140px' }}>
                  <label className="form-label">How many months?</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 12"
                    min="1"
                    max="99"
                    value={grossMonths}
                    onChange={(e) => {
                      const v = e.target.value.slice(0, 2);
                      setGrossMonths(v);
                    }}
                  />
                </div>
              </div>
              <div className="calc-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!grossMonthly || !grossMonths}
                  onClick={() => {
                    setGrossPay(String(Math.round(parseFloat(grossMonthly) * parseFloat(grossMonths))));
                  }}
                >
                  Calculate
                </button>
                <button type="button" className="back-to-search-btn" onClick={() => setShowGrossCalc(false)}>
                  Close calculator
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Accommodation */}
        <section className="form-section">
          <h2>Accommodation</h2>
          <div className="form-group">
            <label className="form-label">Accommodation Type *</label>
            <select className="form-select" value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)}>
              <option value="">Select type...</option>
              {ACCOMMODATION_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          {accommodationType === 'allowance' && (
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Allowance Amount (per year){grossCurrency ? ` in ${grossCurrency}` : ''}</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 12000"
                value={accommodationAllowance}
                onChange={(e) => setAccommodationAllowance(e.target.value)}
                style={{ maxWidth: '280px' }}
              />
            </div>
          )}
        </section>

        {/* Optional Fields */}
        <section className="form-section">
          <h2>Additional Details <span className="optional-tag">Optional</span></h2>

          {/* Net Pay */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taxNotApplicable}
                onChange={(e) => setTaxNotApplicable(e.target.checked)}
              />
              Tax not applicable
            </label>
          </div>

          {!taxNotApplicable && (
            <>
              <div className="form-group">
                <label className="form-label">Estimated Net Pay Per Annum (after tax){grossCurrency ? ` in ${grossCurrency}` : ''}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 38000"
                  value={netPay}
                  onChange={(e) => setNetPay(e.target.value)}
                  style={{ maxWidth: '280px' }}
                />
              </div>
              {!showNetCalc ? (
                <button type="button" className="help-calc-btn" onClick={() => setShowNetCalc(true)}>
                  Help calculating
                </button>
              ) : (
                <div className="calc-box">
                  <div className="form-row">
                    <div className="form-group flex-grow">
                      <label className="form-label">Net pay per month (after tax)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 3000"
                        value={netMonthly}
                        onChange={(e) => setNetMonthly(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ minWidth: '140px' }}>
                      <label className="form-label">How many months?</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 12"
                        min="1"
                        max="99"
                        value={netMonths}
                        onChange={(e) => {
                          const v = e.target.value.slice(0, 2);
                          setNetMonths(v);
                        }}
                      />
                    </div>
                  </div>
                  <div className="calc-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!netMonthly || !netMonths}
                      onClick={() => {
                        setNetPay(String(Math.round(parseFloat(netMonthly) * parseFloat(netMonths))));
                      }}
                    >
                      Calculate
                    </button>
                    <button type="button" className="back-to-search-btn" onClick={() => setShowNetCalc(false)}>
                      Close calculator
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other Benefits */}
          <h3 className="benefits-subtitle">Other Benefits</h3>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={pensionOffered}
                onChange={(e) => setPensionOffered(e.target.checked)}
              />
              Pension offered
            </label>
          </div>
          {pensionOffered && (
            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label className="form-label">Pension Percentage</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 5"
                step="0.1"
                value={pensionPercentage}
                onChange={(e) => setPensionPercentage(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={childPlacesOffered}
                onChange={(e) => {
                  setChildPlacesOffered(e.target.checked);
                  if (!e.target.checked) {
                    setChildPlaces('');
                    setChildPlacesDetail('');
                  }
                }}
              />
              Places for children
            </label>
          </div>
          {childPlacesOffered && (
            <>
              <div className="form-group">
                <label className="form-label">Number of Places</label>
                <select className="form-select" value={childPlaces} onChange={(e) => setChildPlaces(e.target.value)} style={{ maxWidth: '200px' }}>
                  <option value="">Select...</option>
                  {CHILD_PLACES_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Any additional details..."
                  value={childPlacesDetail}
                  onChange={(e) => setChildPlacesDetail(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={medicalInsurance}
                onChange={(e) => setMedicalInsurance(e.target.checked)}
              />
              Comprehensive medical insurance
            </label>
          </div>
          {medicalInsurance && (
            <div className="form-group">
              <label className="form-label">Insurance Details</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cigna Global, family cover..."
                value={medicalInsuranceDetail}
                onChange={(e) => setMedicalInsuranceDetail(e.target.value)}
              />
            </div>
          )}
        </section>

        {error && <div className="error-banner">{error}</div>}

        {showLowSalaryWarning && (
          <div className="low-salary-warning">
            <p>Are you sure? Please ensure you submit your <strong>annual</strong> gross, not monthly. Use the "Help calculating" option if you are not sure.</p>
            <div className="low-salary-actions">
              <button type="submit" className="btn btn-primary btn-sm">Yes, Submit</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLowSalaryWarning(false)}>Go Back</button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Salary'}
        </button>
      </form>
    </div>
  );
}
