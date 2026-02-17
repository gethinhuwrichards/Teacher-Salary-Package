import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { getPositionLabel } from '../utils/constants';
import './SubmissionCard.css';

export default function SubmissionCard({ submission }) {
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);
  const s = submission;

  const positionClass = s.position.includes('senior_leader') ? 'badge-senior' :
    s.position === 'middle_leader' ? 'badge-middle' : 'badge-teacher';

  return (
    <div className="submission-card">
      <div className="card-header">
        <span className={`position-badge ${positionClass}`}>
          {getPositionLabel(s.position)}
        </span>
        <span className="card-date">
          Submitted: {new Date(s.submitted_at).getFullYear()}
        </span>
      </div>

      <div className="card-salary">
        <div className="salary-main">
          <span className="salary-label">Gross Annual</span>
          <span className="salary-amount">
            {formatCurrency(s[`gross_${field}`], currency)}
          </span>
          {s.local_currency_code && s.local_currency_code !== currency && (
            <span className="salary-local">
              {formatCurrency(s.gross_local, s.local_currency_code)}
            </span>
          )}
        </div>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <span className="detail-label">Accommodation</span>
          <span className="detail-value">
            {s.accommodation_type === 'allowance' ? (
              <>Allowance: {formatCurrency(s[`accommodation_${field}`], currency)}</>
            ) : s.accommodation_type === 'provided_furnished' ? (
              'Provided (Furnished)'
            ) : s.accommodation_type === 'provided_unfurnished' ? (
              'Provided (Unfurnished)'
            ) : (
              'Not Provided'
            )}
          </span>
        </div>

        {s.net_pay && !s.tax_not_applicable && (
          <div className="detail-row">
            <span className="detail-label">Estimated Net</span>
            <span className="detail-value">
              {formatCurrency(s[`net_${field}`], currency)}
            </span>
          </div>
        )}

        {s.tax_not_applicable && (
          <div className="detail-row">
            <span className="detail-label">Tax</span>
            <span className="detail-value">Not applicable</span>
          </div>
        )}

        {s.pension_offered && (
          <div className="detail-row">
            <span className="detail-label">Pension</span>
            <span className="detail-value">
              Yes{s.pension_percentage ? ` (${s.pension_percentage}%)` : ''}
            </span>
          </div>
        )}

        {s.child_places && s.child_places !== '0' && (
          <div className="detail-row">
            <span className="detail-label">Child Places</span>
            <span className="detail-value">
              {s.child_places === '2_plus' ? '2+' : s.child_places}
              {s.child_places_detail && ` — ${s.child_places_detail}`}
            </span>
          </div>
        )}

        {s.medical_insurance && (
          <div className="detail-row">
            <span className="detail-label">Medical Insurance</span>
            <span className="detail-value">
              Yes{s.medical_insurance_detail ? ` — ${s.medical_insurance_detail}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
