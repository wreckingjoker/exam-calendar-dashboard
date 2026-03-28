import { useState, useMemo } from 'react'
import { Lock, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { todayString, classesForDate, formatDate, isPast } from '../utils/dates'
import SubjectBadge from './SubjectBadge'

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
]

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PlannerTab({ plans, setPlans, progressMap, classes }) {
  const [selectedDate, setSelectedDate] = useState(todayString())
  const [newTask, setNewTask] = useState({ time: '06:00', topic: '' })
  const [showAdd, setShowAdd] = useState(false)

  const todaysClasses = classesForDate(classes, selectedDate)
  const lockedTimes = new Set(todaysClasses.map((c) => c.time))

  const dayPlan = plans[selectedDate] || []

  // Pending topics for suggestions (not fully done, sorted: overdue first, then same subject)
  const suggestions = useMemo(() => {
    const todaySubjects = new Set(todaysClasses.map((c) => c.subject))
    return classes
      .filter((c) => !(progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone))
      .sort((a, b) => {
        const aOverdue = isPast(a.date) ? -1 : 0
        const bOverdue = isPast(b.date) ? -1 : 0
        if (aOverdue !== bOverdue) return aOverdue - bOverdue
        const aSame = todaySubjects.has(a.subject) ? -1 : 0
        const bSame = todaySubjects.has(b.subject) ? -1 : 0
        return aSame - bSame
      })
      .slice(0, 20)
  }, [classes, progressMap, todaysClasses])

  const addTask = () => {
    if (!newTask.topic.trim()) return
    setPlans((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), { ...newTask, id: Date.now() }],
    }))
    setNewTask((p) => ({ ...p, topic: '' }))
    setShowAdd(false)
  }

  const removeTask = (taskId) => {
    setPlans((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((t) => t.id !== taskId),
    }))
  }

  // Merge locked class blocks + saved tasks, sorted by time
  const allBlocks = [
    ...todaysClasses.map((c) => ({ time: c.time, topic: c.topic, subject: c.subject, type: 'class', id: `class-${c.id}` })),
    ...dayPlan.map((t) => ({ ...t, type: 'task' })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Date navigation */}
      <div className="animate-fade-up-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {formatDate(selectedDate)}
            </p>
            {selectedDate === todayString() && (
              <span className="text-xs text-indigo-600 font-medium">Today</span>
            )}
          </div>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setSelectedDate(todayString())}
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            Jump to today
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="animate-fade-up-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Study Plan</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={13} /> Add Block
          </button>
        </div>

        {allBlocks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">No classes or study blocks for this day.</p>
            <p className="text-slate-400 text-xs mt-1">Add a study block to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allBlocks.map((block) => (
              <div
                key={block.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  block.type === 'class'
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex-shrink-0 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 shadow-sm whitespace-nowrap">
                  {block.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{block.topic}</p>
                  {block.subject && (
                    <div className="mt-1">
                      <SubjectBadge subject={block.subject} short />
                    </div>
                  )}
                </div>
                {block.type === 'class' ? (
                  <Lock size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <button
                    onClick={() => removeTask(block.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add block form */}
      {showAdd && (
        <div className="animate-fade-up-3 bg-white rounded-2xl shadow-sm border border-indigo-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Add Study Block</h3>
          <div className="flex gap-3">
            <select
              value={newTask.time}
              onChange={(e) => setNewTask((p) => ({ ...p, time: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {TIME_SLOTS.filter((t) => !lockedTimes.has(t)).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Topic or note..."
              value={newTask.topic}
              onChange={(e) => setNewTask((p) => ({ ...p, topic: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Suggested topics (pending / overdue):</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setNewTask((p) => ({ ...p, topic: s.topic }))}
                  className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-indigo-200 text-left"
                >
                  {s.topic.length > 40 ? s.topic.slice(0, 40) + '…' : s.topic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addTask}
              className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Block
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
