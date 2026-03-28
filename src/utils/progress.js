/**
 * Returns 0–100 overall completion % (both videoDone AND notesDone required)
 */
export const overallProgress = (progressMap, classes) => {
  if (!classes.length) return 0
  const done = classes.filter(
    (c) => progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone
  ).length
  return Math.round((done / classes.length) * 100)
}

/**
 * Returns per-subject completion % based on videoDone only
 * { "Verbal Ability": 40, "Quantitative Ability": 60, ... }
 */
export const subjectProgress = (progressMap, classes) => {
  const subjects = {}
  classes.forEach((c) => {
    if (!subjects[c.subject]) subjects[c.subject] = { done: 0, total: 0 }
    subjects[c.subject].total++
    if (progressMap[c.id]?.videoDone) subjects[c.subject].done++
  })
  return Object.fromEntries(
    Object.entries(subjects).map(([s, v]) => [
      s,
      Math.round((v.done / v.total) * 100),
    ])
  )
}

/**
 * Returns count of fully completed topics
 */
export const completedCount = (progressMap, classes) =>
  classes.filter(
    (c) => progressMap[c.id]?.videoDone && progressMap[c.id]?.notesDone
  ).length
