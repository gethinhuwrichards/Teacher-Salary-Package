import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import SubmissionCard from '../components/SubmissionCard';
import './SchoolPage.css';

export default function SchoolPage() {
  const { id } = useParams();
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [school, setSchool] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSchool(id),
      api.getSchoolSubmissions(id),
    ])
      .then(([schoolData, subsData]) => {
        setSchool(schoolData);
        setSubmissions(subsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="loading">Loading school data...</div>;
  }

  if (!school) {
    return <div className="empty-state">School not found.</div>;
  }

  // Sort submissions newest to oldest
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
  );

  return (
    <div className="school-page">
      <Link to="/browse" className="back-link">← Back to Browse</Link>

      <div className="school-header">
        <h1>{school.name}</h1>
        <span className="school-country">{school.countries?.name}</span>
      </div>

      {school.averages && (
        <div className="headline-card">
          <div className="headline-label">Average Teacher Gross Salary</div>
          <div className="headline-amount">
            {formatCurrency(school.averages[field], currency)}
          </div>
          {school.averages.local_currency_code && school.averages.local_currency_code !== currency && (
            <div className="headline-local">
              {formatCurrency(school.averages.local, school.averages.local_currency_code)}
            </div>
          )}
          <div className="headline-meta">
            Based on {school.averages.count} teacher {school.averages.count === 1 ? 'submission' : 'submissions'} (excluding senior leadership)
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="empty-state">No approved submissions for this school yet.</div>
      ) : (
        <div className="submissions-list">
          <h2 className="submissions-heading">Submissions</h2>
          <div className="submissions-grid">
            {sorted.map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
