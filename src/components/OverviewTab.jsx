import { useState, useEffect } from 'react'
import { Flame, Target, BookCheck, Clock, Zap } from 'lucide-react'
import { countdown, classesForDate, todayString, formatDate } from '../utils/dates'
import { overallProgress, subjectProgress } from '../utils/progress'
import { get } from '../utils/storage'
import SubjectBadge, { SUBJECT_COLORS } from './SubjectBadge'

const TOTAL = 57
// Estimated effort per topic: 1hr video + 1hr notes = 2hrs
const HRS_PER_TOPIC = 2

function motivationalMessage(pct) {
  if (pct === 0)  return "Let's get started! Every topic counts."
  if (pct < 20)  return "Great start! Building the foundation."
  if (pct < 40)  return "Picking up pace! Keep at it."
  if (pct < 60)  return "Halfway there! You're doing great."
  if (pct < 80)  return "Final stretch! Almost there."
  if (pct < 100) return "So close! Finish strong!"
  return "All done! You're exam-ready!"
}

function ProgressRing({ percent, size = 160, stroke = 12 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#6366f1"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="ring-progress"
      />
    </svg>
  )
}

export default function OverviewTab({ progressMap, examDate, classes }) {
  const [time, setTime] = useState(countdown(examDate))

  useEffect(() => {
    setTime(countdown(examDate))
    const id = setInterval(() => setTime(countdown(examDate)), 60000)
    return () => clearInterval(id)
  }, [examDate])

  const today = todayString()
  const todaysClasses = classesForDate(classes, today)
  const pct = overallProgress(progressMap, classes)
  const subjectPct = subjectProgress(progressMap, classes)
  const streak = get('kmat_streak', { count: 0, lastDate: null })
  const completedCount = classes.filter(
    (c) => progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone
  ).length

  // Study hours calculation
  const remainingTopics = TOTAL - completedCount
  const totalHrsNeeded = remainingTopics * HRS_PER_TOPIC
  const daysLeft = time.days
  const hrsPerDay = daysLeft > 0 ? (totalHrsNeeded / daysLeft).toFixed(1) : '—'
  const hrsPerDayNum = daysLeft > 0 ? totalHrsNeeded / daysLeft : null

  // Per-subject pending hours
  const subjectHrs = (() => {
    const map = {}
    classes.forEach((c) => {
      if (!map[c.subject]) map[c.subject] = 0
      const done = progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone
      if (!done) map[c.subject] += HRS_PER_TOPIC
    })
    return Object.entries(map).filter(([, h]) => h > 0).sort((a, b) => b[1] - a[1])
  })()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Countdown */}
      <div className="animate-fade-up-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Exam Countdown
          </h2>
        </div>
        <div className="flex items-center gap-4 justify-center">
          {[
            { val: time.days,    label: 'Days' },
            { val: time.hours,   label: 'Hours' },
            { val: time.minutes, label: 'Mins' },
          ].map(({ val, label }, i) => (
            <div key={label} className="flex flex-col items-center">
              <div className="bg-indigo-600 text-white rounded-xl w-20 h-20 flex items-center justify-center text-3xl font-bold shadow-md" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {String(val).padStart(2, '0')}
              </div>
              <span className="text-xs text-slate-500 mt-1 font-medium">{label}</span>
              {i < 2 && <span className="absolute text-slate-400 text-2xl font-bold" style={{ marginTop: '-2px' }}></span>}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          Target date: <span className="font-semibold text-slate-700">{examDate}</span>
        </p>
      </div>

      {/* Progress ring + motivational */}
      <div className="animate-fade-up-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <ProgressRing percent={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{pct}%</span>
            <span className="text-xs text-slate-500">complete</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">{motivationalMessage(pct)}</p>
            <p className="text-xs text-slate-500">{completedCount} of {TOTAL} topics fully done</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-indigo-700" style={{ fontFamily: 'Outfit, sans-serif' }}>{completedCount}</p>
              <p className="text-xs text-indigo-600">Completed</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700" style={{ fontFamily: 'Outfit, sans-serif' }}>{TOTAL - completedCount}</p>
              <p className="text-xs text-amber-600">Remaining</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-orange-700" style={{ fontFamily: 'Outfit, sans-serif' }}>{streak.count}</p>
              <p className="text-xs text-orange-600 flex items-center justify-center gap-0.5">
                <Flame size={10} /> Streak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Study hours recommendation */}
      <div className="animate-fade-up-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Study Hours Needed
          </h2>
        </div>

        {/* Main callout */}
        <div className={`rounded-xl p-4 mb-4 flex items-center gap-4 ${
          hrsPerDayNum === null ? 'bg-slate-50' :
          hrsPerDayNum <= 2 ? 'bg-green-50 border border-green-200' :
          hrsPerDayNum <= 4 ? 'bg-amber-50 border border-amber-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="text-center flex-shrink-0">
            <p className={`text-4xl font-bold leading-none ${
              hrsPerDayNum === null ? 'text-slate-400' :
              hrsPerDayNum <= 2 ? 'text-green-700' :
              hrsPerDayNum <= 4 ? 'text-amber-700' :
              'text-red-700'
            }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              {hrsPerDay}
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${
              hrsPerDayNum === null ? 'text-slate-400' :
              hrsPerDayNum <= 2 ? 'text-green-600' :
              hrsPerDayNum <= 4 ? 'text-amber-600' :
              'text-red-600'
            }`}>hrs / day</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {hrsPerDayNum === null
                ? 'Exam date passed or not set.'
                : hrsPerDayNum <= 2
                ? 'Comfortable pace — you have time!'
                : hrsPerDayNum <= 4
                ? 'Manageable — stay consistent.'
                : 'Intensive — prioritise every day.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span><span className="font-semibold text-slate-700">{remainingTopics}</span> topics left</span>
              <span>×</span>
              <span><span className="font-semibold text-slate-700">{HRS_PER_TOPIC} hrs</span> each</span>
              <span>=</span>
              <span><span className="font-semibold text-slate-700">{totalHrsNeeded} hrs</span> total</span>
              <span>÷</span>
              <span><span className="font-semibold text-slate-700">{daysLeft}</span> days left</span>
            </div>
          </div>
        </div>

        {/* Per-subject breakdown */}
        {subjectHrs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Hours remaining by subject</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {subjectHrs.map(([subject, hrs]) => (
                <div
                  key={subject}
                  className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SUBJECT_COLORS[subject] }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 truncate">{subject.replace(' Ability', '').replace(' Comprehension', ' Comp.')}</p>
                    <p className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>{hrs} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3">
          Estimate: {HRS_PER_TOPIC} hrs per topic (1hr video + 1hr notes). Adjust your pace as needed.
        </p>
      </div>

      {/* Subject progress bars */}
      <div className="animate-fade-up-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>Subject Progress</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(subjectPct).map(([subject, pct]) => (
            <div key={subject}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-700 font-medium">{subject}</span>
                <span className="text-xs font-semibold text-slate-600">{pct}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: SUBJECT_COLORS[subject] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's classes */}
      <div className="animate-fade-up-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookCheck size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Today's Classes <span className="text-slate-400 font-normal text-sm">— {formatDate(today)}</span>
          </h2>
        </div>
        {todaysClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No TIME classes scheduled today.</p>
            <p className="text-slate-400 text-xs mt-1">Great day for self-study!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysClasses.map((cls) => {
              const done = progressMap[cls.id]?.videoDone && progressMap[cls.id]?.notesDone
              return (
                <div
                  key={cls.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 whitespace-nowrap shadow-sm">
                    {cls.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-green-800 line-through' : 'text-slate-800'}`}>
                      {cls.topic}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{cls.code}</p>
                  </div>
                  <SubjectBadge subject={cls.subject} short />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
