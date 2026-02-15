export const POSITIONS = [
  { value: 'classroom_teacher', label: 'Classroom Teacher' },
  { value: 'teacher_additional_responsibilities', label: 'Teacher with Additional Responsibilities' },
  { value: 'middle_leader', label: 'Middle Leader' },
  { value: 'senior_leader_other', label: 'Senior Leader - Other' },
  { value: 'senior_leader_head', label: 'Senior Leader - Head' },
];

export const ACCOMMODATION_TYPES = [
  { value: 'allowance', label: 'Allowance' },
  { value: 'provided_furnished', label: 'Provided (Furnished)' },
  { value: 'provided_unfurnished', label: 'Provided (Unfurnished)' },
  { value: 'not_provided', label: 'Not Provided' },
];

export const CHILD_PLACES_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '2_plus', label: '2+' },
];

export const PREFERRED_CURRENCIES = ['USD', 'GBP', 'EUR'];

export function getPositionLabel(value) {
  return POSITIONS.find(p => p.value === value)?.label || value;
}
