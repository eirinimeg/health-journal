/**
 * Detect meal type from a time string "HH:MM" or a Date object.
 * Rules:
 *   before 11:00         → breakfast
 *   11:00 – 13:59        → snack (between breakfast and lunch)
 *   14:00 – 16:00        → lunch
 *   16:01 – 18:59        → snack
 *   19:00 – 23:00        → dinner
 *   after  23:00         → snack
 */
export function detectMealType(time) {
  let hour, minute
  if (time instanceof Date) {
    hour = time.getHours()
    minute = time.getMinutes()
  } else {
    const [h, m] = time.split(':').map(Number)
    hour = h
    minute = m ?? 0
  }

  const totalMinutes = hour * 60 + minute

  if (totalMinutes < 11 * 60) return 'breakfast'
  if (totalMinutes < 14 * 60) return 'snack'
  if (totalMinutes <= 16 * 60) return 'lunch'
  if (totalMinutes < 19 * 60) return 'snack'
  if (totalMinutes <= 23 * 60) return 'dinner'
  return 'snack'
}

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export const MEAL_EMOJI = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

/** Return today's date as YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/** Return current time as HH:MM */
export function nowTimeStr() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
