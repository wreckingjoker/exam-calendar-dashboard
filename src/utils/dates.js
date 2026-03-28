/**
 * Returns { days, hours, minutes } until examDate
 */
export const countdown = (examDate) => {
  const diff = new Date(examDate) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  }
}

/**
 * Returns "YYYY-MM-DD" for today
 */
export const todayString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns classes scheduled for the given date string "YYYY-MM-DD"
 */
export const classesForDate = (classes, date) =>
  classes.filter((c) => c.date === date)

/**
 * Format "YYYY-MM-DD" to display string e.g. "Mon, 28 Mar"
 */
export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Check if a date string is in the past (before today)
 */
export const isPast = (dateStr) => dateStr < todayString()

/**
 * Check if a date string is today
 */
export const isToday = (dateStr) => dateStr === todayString()
