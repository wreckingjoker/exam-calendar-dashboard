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
 * Returns per-subject completion % using weighted score:
 *   videoDone = 0.5, notesDone = 0.5 → both = 1.0 (fully done)
 * This ensures the bars respond to any checkbox being ticked.
 */
export const subjectProgress = (progressMap, classes) => {
  const subjects = {}
  classes.forEach((c) => {
    if (!subjects[c.subject]) subjects[c.subject] = { score: 0, total: 0 }
    subjects[c.subject].total++
    const p = progressMap[c.id]
    if (p?.videoDone) subjects[c.subject].score += 0.5
    if (p?.notesDone) subjects[c.subject].score += 0.5
  })
  return Object.fromEntries(
    Object.entries(subjects).map(([s, v]) => [
      s,
      Math.round((v.score / v.total) * 100),
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
