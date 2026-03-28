import { useState, useMemo } from 'react'
import { Plus, Trash2, TrendingUp, Award, ClipboardList } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'

const SUBJECTS = ['QA', 'VA', 'LA', 'DI']
const SUBJECT_COLORS = { QA: '#3B82F6', VA: '#8B5CF6', LA: '#F59E0B', DI: '#14B8A6' }

const emptyForm = () => ({
  name: '',
  date: new Date().toISOString().split('T')[0],
  total: 100,
  score: '',
  subjects: { QA: '', VA: '', LA: '', DI: '' },
})

export default function MockTestTab({ mockTests, setMockTests }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState('')

  const submit = () => {
    if (!form.name.trim()) return setError('Test name is required.')
    if (!form.date) return setError('Date is required.')
    const score = Number(form.score)
    const total = Number(form.total)
    if (isNaN(score) || score < 0 || score > total) return setError('Score must be between 0 and total.')

    setMockTests((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: form.name,
        date: form.date,
        total,
        score,
        pct: Math.round((score / total) * 100),
        subjects: Object.fromEntries(
          Object.entries(form.subjects).map(([k, v]) => [k, v === '' ? null : Number(v)])
        ),
      },
    ])
    setForm(emptyForm())
    setError('')
    setShowForm(false)
  }

  const deleteTest = (id) => setMockTests((prev) => prev.filter((t) => t.id !== id))

  // Chart data
  const chartData = useMemo(() =>
    [...mockTests]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({ name: t.name.slice(0, 12), pct: t.pct, date: t.date })),
    [mockTests]
  )

  // Radar data (average per subject)
  const radarData = useMemo(() => {
    return SUBJECTS.map((s) => {
      const vals = mockTests.map((t) => t.subjects[s]).filter((v) => v !== null && v !== undefined)
      return { subject: s, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 }
    })
  }, [mockTests])

  const best = mockTests.length ? Math.max(...mockTests.map((t) => t.pct)) : null
  const latest = mockTests.length ? mockTests[mockTests.length - 1] : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Stat cards */}
      <div className="animate-fade-up-1 grid grid-cols-3 gap-3">
        {[
          { label: 'Tests Taken', value: mockTests.length, Icon: ClipboardList, color: 'indigo' },
          { label: 'Best Score', value: best !== null ? `${best}%` : '—', Icon: Award, color: 'green' },
          { label: 'Latest Score', value: latest ? `${latest.pct}%` : '—', Icon: TrendingUp, color: 'blue' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center`}>
            <div className={`inline-flex p-2 rounded-xl bg-${color}-50 mb-2`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Add test button */}
      <div className="animate-fade-up-2 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Log Test
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="animate-fade-up-2 bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Log Mock Test</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Test Name *</label>
              <input
                type="text"
                placeholder="e.g. KMAT Mock 1"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Score *</label>
              <input
                type="number"
                placeholder="e.g. 78"
                value={form.score}
                onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Marks</label>
              <input
                type="number"
                value={form.total}
                onChange={(e) => setForm((p) => ({ ...p, total: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Section Scores (optional)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SUBJECTS.map((s) => (
                <div key={s}>
                  <label className="text-xs text-slate-500 mb-1 block">{s}</label>
                  <input
                    type="number"
                    placeholder="—"
                    value={form.subjects[s]}
                    onChange={(e) => setForm((p) => ({ ...p, subjects: { ...p.subjects, [s]: e.target.value } }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
              Save Test
            </button>
            <button onClick={() => { setShowForm(false); setError('') }} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      {mockTests.length > 0 && (
        <>
          <div className="animate-fade-up-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Score Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {radarData.some((d) => d.value > 0) && (
            <div className="animate-fade-up-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Subject Strengths</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Test history table */}
      <div className="animate-fade-up-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>Test History</h3>
        </div>
        {mockTests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No tests logged yet.</p>
            <p className="text-slate-400 text-xs mt-1">Log your first mock test above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Test</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-center px-4 py-3">Score</th>
                  {SUBJECTS.map((s) => (
                    <th key={s} className="text-center px-3 py-3">{s}</th>
                  ))}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...mockTests].reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-500">{t.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-12 h-7 rounded-lg text-xs font-bold ${
                        t.pct >= 70 ? 'bg-green-100 text-green-700' :
                        t.pct >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.pct}%
                      </span>
                    </td>
                    {SUBJECTS.map((s) => (
                      <td key={s} className="px-3 py-3 text-center text-slate-500 text-xs">
                        {t.subjects[s] !== null && t.subjects[s] !== undefined ? t.subjects[s] : '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteTest(t.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Delete test"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
