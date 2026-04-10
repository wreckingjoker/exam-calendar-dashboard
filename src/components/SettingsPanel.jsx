import { useState } from 'react'
import { X, CalendarDays, AlertTriangle, RotateCcw, Timer } from 'lucide-react'

export default function SettingsPanel({ examDate, setExamDate, dailyTarget, setDailyTarget, onReset, onClose }) {
  const [localDate, setLocalDate] = useState(examDate)
  const [localTarget, setLocalTarget] = useState(String(dailyTarget))
  const [showConfirm, setShowConfirm] = useState(false)
  const [savedDate, setSavedDate] = useState(false)
  const [savedTarget, setSavedTarget] = useState(false)

  const handleSaveDate = () => {
    if (localDate) {
      setExamDate(localDate)
      setSavedDate(true)
      setTimeout(() => setSavedDate(false), 2000)
    }
  }

  const handleSaveTarget = () => {
    const val = parseFloat(localTarget)
    if (!isNaN(val) && val > 0) {
      setDailyTarget(val)
      setSavedTarget(true)
      setTimeout(() => setSavedTarget(false), 2000)
    }
  }

  const handleReset = () => {
    onReset()
    setShowConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-fade-up-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Exam date */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-700">Exam Target Date</h3>
          </div>
          <p className="text-xs text-slate-500">
            Set the countdown target. Update when official KMAT/MAT dates are announced.
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={localDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setLocalDate(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleSaveDate}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${savedDate ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {savedDate ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Daily study target */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-700">Daily Study Target</h3>
          </div>
          <p className="text-xs text-slate-500">
            How many hours do you plan to study each day? Used to predict your finish date.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0.5" max="24" step="0.5"
              value={localTarget}
              onChange={(e) => setLocalTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTarget()}
              className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-sm text-slate-500 font-medium">hours / day</span>
            <button
              onClick={handleSaveTarget}
              className={`ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${savedTarget ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {savedTarget ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="bg-red-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Reset All Data</h3>
          </div>
          <p className="text-xs text-red-600/80">
            Clears all progress, study plans, mock test scores, study log, and streak. This cannot be undone.
          </p>
          {showConfirm ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-red-100 rounded-lg p-3">
                <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700 font-medium">Are you sure? All your progress will be permanently deleted.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleReset} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-red-700 transition-colors">
                  Yes, Reset Everything
                </button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="w-full bg-white border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors">
              Reset All Data
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          KMAT & MAT Study Dashboard · All data stored locally in your browser
        </p>
      </div>
    </div>
  )
}
