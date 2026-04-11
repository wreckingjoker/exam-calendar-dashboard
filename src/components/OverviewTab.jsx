import { useState, useEffect, useRef } from 'react'
import { Flame, Target, BookCheck, Clock, Zap, Timer, CalendarCheck, Pencil, Check, Play, Square, History } from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, AreaChart, Area,
} from 'recharts'

// Custom bar shape — colours each bar individually without using deprecated Cell
function StudyBar(props) {
  const { x, y, width, height, isToday, hit, hrs } = props
  if (!height || height <= 0) return null
  const fill = isToday ? '#6366f1' : hit ? '#4ade80' : hrs > 0 ? '#fbbf24' : '#e2e8f0'
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />
}
import { countdown, classesForDate, todayString, formatDate } from '../utils/dates'
import { overallProgress, subjectProgress } from '../utils/progress'
import { get } from '../utils/storage'
import SubjectBadge, { SUBJECT_COLORS } from './SubjectBadge'

const TOTAL = 57
const HRS_PER_TOPIC = 3.5

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
        fill="none" stroke="#6366f1" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="ring-progress"
      />
    </svg>
  )
}

/** Returns "YYYY-MM-DD" for N days from today */
function addDaysToToday(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Last N days as "YYYY-MM-DD" strings, oldest first */
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => addDaysToToday(i - n + 1))
}

/** Format seconds → "H:MM:SS" */
function fmtElapsed(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Format timestamp → "HH:MM" */
function fmtTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function OverviewTab({ progressMap, examDate, classes, dailyTarget, setDailyTarget, studyLog, setStudyLog, activeSession, setActiveSession, sessions, setSessions }) {
  const [time, setTime] = useState(countdown(examDate))
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState(String(dailyTarget))
  const [todayInput, setTodayInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)

  // Countdown tick
  useEffect(() => {
    setTime(countdown(examDate))
    const id = setInterval(() => setTime(countdown(examDate)), 60000)
    return () => clearInterval(id)
  }, [examDate])

  // Session elapsed timer — ticks every second when a session is active
  useEffect(() => {
    if (!activeSession) { setElapsed(0); elapsedRef.current = 0; return }
    const update = () => {
      const secs = Math.floor((Date.now() - activeSession.startTimestamp) / 1000)
      elapsedRef.current = secs
      setElapsed(secs)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const today = todayString()

  const startSession = () => {
    setActiveSession({ startTimestamp: Date.now(), startTime: fmtTime(Date.now()) })
  }

  const endSession = () => {
    if (!activeSession) return
    const endTs = Date.now()
    const durationHrs = parseFloat(((endTs - activeSession.startTimestamp) / 3600000).toFixed(2))
    const session = { start: activeSession.startTime, end: fmtTime(endTs), durationHrs }
    setSessions(prev => ({ ...prev, [today]: [...(prev[today] || []), session] }))
    setStudyLog(prev => ({ ...prev, [today]: parseFloat(((prev[today] || 0) + durationHrs).toFixed(2)) }))
    setActiveSession(null)
  }
  const todaysClasses = classesForDate(classes, today)
  const pct = overallProgress(progressMap, classes)
  const subjectPct = subjectProgress(progressMap, classes)
  const streak = get('kmat_streak', { count: 0, lastDate: null })
  const completedCount = classes.filter(
    (c) => progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone
  ).length

  // Study hours needed (exam deadline)
  const remainingTopics = TOTAL - completedCount
  const totalHrsNeeded = remainingTopics * HRS_PER_TOPIC
  const daysLeft = time.days
  const hrsPerDayNeeded = daysLeft > 0 ? totalHrsNeeded / daysLeft : null

  // Per-subject pending hours (deduct proportionally: each checkbox = 0.5 topic)
  const subjectHrs = (() => {
    const map = {}
    classes.forEach((c) => {
      if (!map[c.subject]) map[c.subject] = 0
      const p = progressMap[c.id]
      const doneScore = (p?.videoDone ? 0.5 : 0) + (p?.notesDone ? 0.5 : 0)
      map[c.subject] += (1 - doneScore) * HRS_PER_TOPIC
    })
    return Object.entries(map)
      .filter(([, h]) => h > 0.1)
      .map(([s, h]) => [s, parseFloat(h.toFixed(1))])
      .sort((a, b) => b[1] - a[1])
  })()

  // ── Live session contribution ──
  // Elapsed seconds → hours for the running session (updates every second via elapsed state)
  const liveSessionHrs = activeSession ? parseFloat((elapsed / 3600).toFixed(2)) : 0

  // Effective today total = already saved hours + current live session
  const savedTodayHrs = studyLog[today] ?? 0
  const effectiveTodayHrs = parseFloat((savedTodayHrs + liveSessionHrs).toFixed(2))

  // ── Study tracker calculations (all use effectiveTodayHrs for today) ──
  const todayLogged = effectiveTodayHrs > 0 ? effectiveTodayHrs : null

  // Build an effective studyLog that replaces today's entry with the live total
  const effectiveLog = { ...studyLog, ...(effectiveTodayHrs > 0 ? { [today]: effectiveTodayHrs } : {}) }
  const logEntries = Object.entries(effectiveLog).filter(([, h]) => h > 0)
  const totalLoggedHrs = logEntries.reduce((s, [, h]) => s + h, 0)
  const avgActualHrs = logEntries.length > 0 ? totalLoggedHrs / logEntries.length : null

  // ── Remaining hours adjusts for today's live progress ──
  const totalHrsRemaining = Math.max(0, totalHrsNeeded - totalLoggedHrs)

  // Finish date predictions
  const daysToFinishAtTarget = dailyTarget > 0 ? Math.ceil(totalHrsRemaining / dailyTarget) : null
  const daysToFinishAtActual = avgActualHrs && avgActualHrs > 0 ? Math.ceil(totalHrsRemaining / avgActualHrs) : null

  const targetFinishDate = daysToFinishAtTarget !== null ? addDaysToToday(daysToFinishAtTarget) : null
  const actualFinishDate = daysToFinishAtActual !== null ? addDaysToToday(daysToFinishAtActual) : null

  const bufferAtTarget = targetFinishDate ? daysLeft - daysToFinishAtTarget : null
  const bufferAtActual = actualFinishDate ? daysLeft - daysToFinishAtActual : null

  // ── Chart data (use effectiveLog so live session appears in graphs) ──

  // 14-day ComposedChart: bars + 3-day rolling average line
  const chartData14 = lastNDays(14).map((d, i, arr) => {
    const hrs = effectiveLog[d] ?? 0
    const hit = hrs >= dailyTarget
    const isToday = d === today
    const window = arr.slice(Math.max(0, i - 2), i + 1).map(dd => effectiveLog[dd] ?? 0)
    const avg = window.some(v => v > 0)
      ? parseFloat((window.reduce((a, b) => a + b, 0) / window.length).toFixed(1))
      : null
    return {
      label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }).replace(',', ''),
      hrs: parseFloat(hrs.toFixed(2)),
      avg,
      hit,
      isToday,
    }
  })

  // Cumulative area chart: actual vs required pace
  const cumulativeData = (() => {
    const days = lastNDays(14)
    let cumActual = 0
    const dailyRequired = daysLeft > 0 ? totalHrsNeeded / daysLeft : 0
    return days.map((d, i) => {
      cumActual += effectiveLog[d] ?? 0
      return {
        label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }).replace(',', ''),
        actual: parseFloat(cumActual.toFixed(1)),
        required: parseFloat(((i + 1) * dailyRequired).toFixed(1)),
      }
    })
  })()

  const saveTarget = () => {
    const val = parseFloat(targetInput)
    if (!isNaN(val) && val > 0) setDailyTarget(val)
    setEditingTarget(false)
  }

  const logToday = () => {
    const val = parseFloat(todayInput)
    if (isNaN(val) || val < 0) return
    setStudyLog((prev) => ({ ...prev, [today]: val }))
    setTodayInput('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Countdown */}
      <div className="animate-fade-up-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>Exam Countdown</h2>
        </div>
        <div className="flex items-center gap-4 justify-center">
          {[{ val: time.days, label: 'Days' }, { val: time.hours, label: 'Hours' }, { val: time.minutes, label: 'Mins' }].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="bg-indigo-600 text-white rounded-xl w-20 h-20 flex items-center justify-center text-3xl font-bold shadow-md" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {String(val).padStart(2, '0')}
              </div>
              <span className="text-xs text-slate-500 mt-1 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          Target date: <span className="font-semibold text-slate-700">{examDate}</span>
        </p>
      </div>

      {/* Progress ring */}
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
              <p className="text-xs text-orange-600 flex items-center justify-center gap-0.5"><Flame size={10} /> Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STUDY TRACKER ── */}
      <div className="animate-fade-up-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>Study Tracker</h2>
        </div>

        {/* ── Session Timer ── */}
        <div className={`rounded-2xl border p-4 transition-all ${activeSession ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer size={16} className={activeSession ? 'text-indigo-200' : 'text-indigo-600'} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${activeSession ? 'text-indigo-200' : 'text-slate-600'}`}>
                {activeSession ? 'Session in Progress' : 'Study Session'}
              </span>
            </div>
            {activeSession && (
              <span className="text-xs text-indigo-200">Started at {activeSession.startTime}</span>
            )}
          </div>

          {activeSession ? (
            <div className="flex items-center justify-between">
              {/* Live elapsed clock */}
              <div>
                <p className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {fmtElapsed(elapsed)}
                </p>
                <p className="text-indigo-200 text-xs mt-1">
                  ≈ {(elapsed / 3600).toFixed(2)} hrs
                </p>
              </div>
              {/* End button */}
              <button
                onClick={endSession}
                className="flex items-center gap-2 bg-white text-indigo-700 font-semibold text-sm px-5 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <Square size={14} fill="currentColor" /> End Session
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Current time</p>
              </div>
              <button
                onClick={startSession}
                className="flex items-center gap-2 bg-indigo-600 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Play size={14} fill="currentColor" /> Start Session
              </button>
            </div>
          )}
        </div>

        {/* Today's session history */}
        {(sessions[today]?.length > 0) && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <History size={13} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Sessions</span>
              <span className="ml-auto text-xs font-bold text-indigo-600">
                {sessions[today].reduce((s, x) => s + x.durationHrs, 0).toFixed(2)} hrs total
              </span>
            </div>
            <div className="space-y-1.5">
              {sessions[today].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-slate-700">{s.start}</span>
                  <span className="text-slate-300">→</span>
                  <span className="font-mono font-semibold text-slate-700">{s.end}</span>
                  <span className="ml-auto bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                    {s.durationHrs < 1
                      ? `${Math.round(s.durationHrs * 60)} min`
                      : `${s.durationHrs.toFixed(2)} hrs`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily target + today's log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* Daily target */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Daily Target</p>
            {editingTarget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0.5" max="24" step="0.5"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveTarget()}
                  autoFocus
                  className="w-20 border border-indigo-300 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-sm text-indigo-700 font-medium">hrs/day</span>
                <button onClick={saveTarget} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-indigo-700" style={{ fontFamily: 'Outfit, sans-serif' }}>{dailyTarget}</span>
                <span className="text-sm text-indigo-600 mb-1 font-medium">hrs/day</span>
                <button onClick={() => { setTargetInput(String(dailyTarget)); setEditingTarget(true) }}
                  className="mb-1 p-1 text-indigo-400 hover:text-indigo-600 transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <p className="text-xs text-indigo-500 mt-1">
              {totalLoggedHrs > 0 ? `${totalLoggedHrs.toFixed(1)} hrs logged across ${logEntries.length} day${logEntries.length !== 1 ? 's' : ''}` : 'No sessions logged yet'}
            </p>
          </div>

          {/* Today's hours — live feed from sessions */}
          <div className={`rounded-xl p-4 border transition-all ${effectiveTodayHrs >= dailyTarget ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Today's Hours</p>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${effectiveTodayHrs >= dailyTarget ? 'text-green-700' : 'text-slate-800'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                {effectiveTodayHrs.toFixed(2)}
              </span>
              <span className="text-sm text-slate-500 mb-1">/ {dailyTarget} hrs</span>
              {activeSession && (
                <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-indigo-600 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                  live
                </span>
              )}
            </div>

            {/* Progress bar toward daily target */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2 mb-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${effectiveTodayHrs >= dailyTarget ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min((effectiveTodayHrs / dailyTarget) * 100, 100)}%` }}
              />
            </div>

            {/* Breakdown: sessions vs manual */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {sessions[today]?.length > 0 && (
                <span>
                  <span className="font-semibold text-slate-700">{sessions[today].reduce((s, x) => s + x.durationHrs, 0).toFixed(2)} hrs</span>
                  {' '}from {sessions[today].length} session{sessions[today].length !== 1 ? 's' : ''}
                </span>
              )}
              {liveSessionHrs > 0 && (
                <span className="text-indigo-600 font-semibold">+ {liveSessionHrs.toFixed(2)} hrs running</span>
              )}
              {savedTodayHrs > 0 && sessions[today]?.length === 0 && (
                <span><span className="font-semibold text-slate-700">{savedTodayHrs} hrs</span> manually logged</span>
              )}
            </div>

            {/* Manual override (only shown when no active session) */}
            {!activeSession && todayLogged === null && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number" min="0" max="24" step="0.5" placeholder="Manual entry"
                  value={todayInput}
                  onChange={(e) => setTodayInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && logToday()}
                  className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button onClick={logToday} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  Log hrs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics charts */}
        <div className="space-y-5">

          {/* Daily study hours — ComposedChart */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Daily Study Hours (Last 14 Days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val, name) => [
                    `${val} hrs`,
                    name === 'hrs' ? 'Studied' : name === 'avg' ? '3-day avg' : name,
                  ]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <ReferenceLine y={dailyTarget} stroke="#6366f1" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: `Target ${dailyTarget}h`, position: 'right', fontSize: 10, fill: '#6366f1' }} />
                <Bar dataKey="hrs" name="hrs" shape={<StudyBar />} isAnimationActive={true} />
                <Line dataKey="avg" name="avg" type="monotone" stroke="#f43f5e" strokeWidth={2} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-400" /><span className="text-[10px] text-slate-500">Target met</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-400" /><span className="text-[10px] text-slate-500">Below target</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-500" /><span className="text-[10px] text-slate-500">Today</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 border-t-2 border-rose-400" /><span className="text-[10px] text-slate-500">3-day avg</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 border-t-2 border-dashed border-indigo-400" /><span className="text-[10px] text-slate-500">Daily target</span></div>
            </div>
          </div>

          {/* Cumulative hours — AreaChart */}
          {cumulativeData.some(d => d.actual > 0) && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cumulative Hours: Actual vs Required</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRequired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val, name) => [`${val} hrs`, name === 'required' ? 'Required pace' : 'Actual studied']}
                  />
                  <Area type="monotone" dataKey="required" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" fill="url(#gradRequired)" dot={false} name="required" />
                  <Area type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} fill="url(#gradActual)" dot={false} name="actual" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5"><div className="w-5 border-t-2 border-green-500" /><span className="text-[10px] text-slate-500">Actual hours</span></div>
                <div className="flex items-center gap-1.5"><div className="w-5 border-t-2 border-dashed border-indigo-500" /><span className="text-[10px] text-slate-500">Required pace</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Finish date predictions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck size={15} className="text-indigo-600" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Predicted Finish Date</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* At target pace */}
            <div className={`rounded-xl p-3 border ${bufferAtTarget !== null && bufferAtTarget >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-xs font-semibold text-slate-600 mb-1">At target pace ({dailyTarget} hrs/day)</p>
              {targetFinishDate ? (
                <>
                  <p className="text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {new Date(targetFinishDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${bufferAtTarget >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {bufferAtTarget >= 0
                      ? `${bufferAtTarget} days buffer before exam ✓`
                      : `${Math.abs(bufferAtTarget)} days after exam — increase daily hours!`}
                  </p>
                </>
              ) : <p className="text-sm text-slate-400">Set a daily target to predict</p>}
            </div>

            {/* At actual pace */}
            <div className={`rounded-xl p-3 border ${
              actualFinishDate === null ? 'bg-slate-50 border-slate-200' :
              bufferAtActual >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs font-semibold text-slate-600 mb-1">
                At actual pace {avgActualHrs ? `(avg ${avgActualHrs.toFixed(1)} hrs/day)` : ''}
              </p>
              {actualFinishDate ? (
                <>
                  <p className="text-base font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {new Date(actualFinishDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${bufferAtActual >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {bufferAtActual >= 0
                      ? `${bufferAtActual} days buffer before exam ✓`
                      : `${Math.abs(bufferAtActual)} days after exam — study more!`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Log a few study sessions to see your actual pace prediction.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Study hours needed (deadline-based) */}
      <div className="animate-fade-up-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>Hours Needed to Finish on Time</h2>
        </div>
        <div className={`rounded-xl p-4 mb-4 flex items-center gap-4 ${
          hrsPerDayNeeded === null ? 'bg-slate-50' :
          hrsPerDayNeeded <= 2 ? 'bg-green-50 border border-green-200' :
          hrsPerDayNeeded <= 4 ? 'bg-amber-50 border border-amber-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="text-center flex-shrink-0">
            <p className={`text-4xl font-bold leading-none ${
              hrsPerDayNeeded === null ? 'text-slate-400' :
              hrsPerDayNeeded <= 2 ? 'text-green-700' :
              hrsPerDayNeeded <= 4 ? 'text-amber-700' : 'text-red-700'
            }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              {hrsPerDayNeeded !== null ? hrsPerDayNeeded.toFixed(1) : '—'}
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${
              hrsPerDayNeeded === null ? 'text-slate-400' :
              hrsPerDayNeeded <= 2 ? 'text-green-600' :
              hrsPerDayNeeded <= 4 ? 'text-amber-600' : 'text-red-600'
            }`}>hrs / day</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {hrsPerDayNeeded === null ? 'Exam date passed or not set.' :
               hrsPerDayNeeded <= 2 ? 'Comfortable pace — you have time!' :
               hrsPerDayNeeded <= 4 ? 'Manageable — stay consistent.' : 'Intensive — prioritise every day.'}
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
        {subjectHrs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Hours remaining by subject</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {subjectHrs.map(([subject, hrs]) => (
                <div key={subject} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SUBJECT_COLORS[subject] }} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 truncate">{subject.replace(' Ability', '').replace(' Comprehension', ' Comp.')}</p>
                    <p className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>{hrs} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-3">Estimate: {HRS_PER_TOPIC} hrs per topic (2.5hr video + 1hr notes).</p>
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
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: SUBJECT_COLORS[subject] }} />
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
                <div key={cls.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 whitespace-nowrap shadow-sm">{cls.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-green-800 line-through' : 'text-slate-800'}`}>{cls.topic}</p>
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
