const SUBJECT_STYLES = {
  'Quantitative Ability':  'bg-blue-100 text-blue-800',
  'Verbal Ability':        'bg-purple-100 text-purple-800',
  'Logical Ability':       'bg-amber-100 text-amber-800',
  'Data Interpretation':   'bg-teal-100 text-teal-800',
  'Reading Comprehension': 'bg-green-100 text-green-800',
  'Data Sufficiency':      'bg-rose-100 text-rose-800',
}

const SUBJECT_SHORT = {
  'Quantitative Ability':  'QA',
  'Verbal Ability':        'VA',
  'Logical Ability':       'LA',
  'Data Interpretation':   'DI',
  'Reading Comprehension': 'RC',
  'Data Sufficiency':      'DS',
}

export const SUBJECT_COLORS = {
  'Quantitative Ability':  '#3B82F6',
  'Verbal Ability':        '#8B5CF6',
  'Logical Ability':       '#F59E0B',
  'Data Interpretation':   '#14B8A6',
  'Reading Comprehension': '#22C55E',
  'Data Sufficiency':      '#F43F5E',
}

export default function SubjectBadge({ subject, short = false }) {
  const cls = SUBJECT_STYLES[subject] || 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
      {short ? (SUBJECT_SHORT[subject] || subject) : subject}
    </span>
  )
}
