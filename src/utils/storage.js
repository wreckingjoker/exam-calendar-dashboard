export const get = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

export const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable
  }
}

export const remove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const clearAll = () => {
  const keys = ['kmat_progress', 'kmat_exam_date', 'kmat_plans', 'kmat_mock_tests', 'kmat_streak']
  keys.forEach(remove)
}
