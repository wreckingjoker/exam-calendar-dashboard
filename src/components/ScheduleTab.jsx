import { useState, useMemo } from 'react'
import { Search, Video, FileText, CheckCircle2, Circle } from 'lucide-react'
import { todayString, isPast, formatDate } from '../utils/dates'
import { get, set } from '../utils/storage'
import SubjectBadge from './SubjectBadge'

const SUBJECTS = [
  'All',
  'Quantitative Ability',
  'Verbal Ability',
  'Logical Ability',
  'Data Interpretation',
  'Reading Comprehension',
  'Data Sufficiency',
]

const FILTERS = ['All', 'Pending', 'Done']

export default function ScheduleTab({ progressMap, setProgressMap, classes }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterSubject, setFilterSubject] = useState('All')

  const today = todayString()

  const toggle = (id, field) => {
    setProgressMap((prev) => {
      const current = prev[id] || { videoDone: false, notesDone: false }
      const updated = { ...current, [field]: !current[field] }
      const newMap = { ...prev, [id]: updated }

      // Update streak
      if (updated.videoDone || updated.notesDone) {
        const streak = get('kmat_streak', { count: 0, lastDate: null })
        if (streak.lastDate !== today) {
          set('kmat_streak', { count: streak.count + 1, lastDate: today })
        }
      }

      return newMap
    })
  }

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const prog = progressMap[c.id] || {}
      const isDone = prog.videoDone && prog.notesDone

      if (filterStatus === 'Done' && !isDone) return false
      if (filterStatus === 'Pending' && isDone) return false
      if (filterSubject !== 'All' && c.subject !== filterSubject) return false
      if (search && !c.topic.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false

      return true
    })
  }, [classes, progressMap, filterStatus, filterSubject, search])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Filters */}
      <div className="animate-fade-up-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics or codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="w-px bg-slate-200 mx-1" />
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterSubject === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'All' ? 'All Subjects' : s.replace(' Ability', '').replace(' Comprehension', ' Comp.')}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">{filtered.length} of {classes.length} sessions shown</p>
      </div>

      {/* Class list */}
      <div className="animate-fade-up-2 space-y-2">
        {filtered.map((cls) => {
          const prog = progressMap[cls.id] || { videoDone: false, notesDone: false }
          const isDone = prog.videoDone && prog.notesDone
          const isOverdue = isPast(cls.date) && !isDone
          const isClassToday = cls.date === today

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-xl border transition-all hover:shadow-sm ${
                isDone
                  ? 'border-green-200'
                  : isOverdue
                  ? 'border-l-4 border-l-red-400 border-slate-100'
                  : isClassToday
                  ? 'border-indigo-200 shadow-sm'
                  : 'border-slate-100'
              }`}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Date/time block */}
                <div className="flex-shrink-0 text-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 min-w-[56px]">
                  <p className="text-xs font-bold text-slate-700 leading-tight">{formatDate(cls.date).split(',')[0]}</p>
                  <p className="text-xs text-slate-500 leading-tight">{formatDate(cls.date).split(',')[1]?.trim()}</p>
                  <p className="text-xs font-semibold text-indigo-600 mt-0.5">{cls.time}</p>
                </div>

                {/* Topic info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {cls.topic}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <SubjectBadge subject={cls.subject} short />
                    <span className="text-xs text-slate-400 font-mono">{cls.code}</span>
                    {isClassToday && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">Today</span>
                    )}
                    {isOverdue && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-1.5 py-0.5 rounded">Overdue</span>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => toggle(cls.id, 'videoDone')}
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5 transition-all ${
                      prog.videoDone
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    aria-label="Mark video done"
                  >
                    {prog.videoDone ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                    <Video size={12} />
                  </button>
                  <button
                    onClick={() => toggle(cls.id, 'notesDone')}
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5 transition-all ${
                      prog.notesDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    aria-label="Mark notes done"
                  >
                    {prog.notesDone ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                    <FileText size={12} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No sessions match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
