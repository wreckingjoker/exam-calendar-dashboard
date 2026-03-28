import { useState, useCallback } from 'react'
import { LayoutDashboard, CalendarDays, BookOpen, BarChart3, Settings } from 'lucide-react'
import { get, set } from './utils/storage'
import classes from './data/classes.json'

import OverviewTab from './components/OverviewTab'
import ScheduleTab from './components/ScheduleTab'
import PlannerTab from './components/PlannerTab'
import MockTestTab from './components/MockTestTab'
import SettingsPanel from './components/SettingsPanel'

import './index.css'

const TABS = [
  { id: 'overview',  label: 'Overview',   Icon: LayoutDashboard },
  { id: 'schedule',  label: 'Schedule',   Icon: CalendarDays },
  { id: 'planner',   label: 'Planner',    Icon: BookOpen },
  { id: 'mocktests', label: 'Mock Tests', Icon: BarChart3 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)

  const [progressMap, setProgressMapState] = useState(() => get('kmat_progress', {}))
  const [examDate, setExamDateState] = useState(() => get('kmat_exam_date', '2026-05-15'))
  const [mockTests, setMockTestsState] = useState(() => get('kmat_mock_tests', []))
  const [plans, setPlansState] = useState(() => get('kmat_plans', {}))

  const setProgressMap = useCallback((updater) => {
    setProgressMapState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      set('kmat_progress', next)
      return next
    })
  }, [])

  const setExamDate = useCallback((date) => {
    setExamDateState(date)
    set('kmat_exam_date', date)
  }, [])

  const setMockTests = useCallback((updater) => {
    setMockTestsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      set('kmat_mock_tests', next)
      return next
    })
  }, [])

  const setPlans = useCallback((updater) => {
    setPlansState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      set('kmat_plans', next)
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setProgressMapState({})
    setExamDateState('2026-05-15')
    setMockTestsState([])
    setPlansState({})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>K</span>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            KMAT <span className="text-slate-400 font-medium">&</span> MAT
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>K</span>
          </div>
          <span className="font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>KMAT & MAT</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        {activeTab === 'overview'  && <OverviewTab progressMap={progressMap} examDate={examDate} classes={classes} />}
        {activeTab === 'schedule'  && <ScheduleTab progressMap={progressMap} setProgressMap={setProgressMap} classes={classes} />}
        {activeTab === 'planner'   && <PlannerTab plans={plans} setPlans={setPlans} progressMap={progressMap} classes={classes} />}
        {activeTab === 'mocktests' && <MockTestTab mockTests={mockTests} setMockTests={setMockTests} />}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
              activeTab === id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {showSettings && (
        <SettingsPanel
          examDate={examDate}
          setExamDate={setExamDate}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
