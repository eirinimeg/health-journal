import MealEntry from './MealEntry'
import { detectMealType, nowTimeStr } from '../lib/mealUtils'

function emptyMeal() {
  const time = nowTimeStr()
  return {
    id: null,
    _key: crypto.randomUUID(),
    description: '',
    meal_type: detectMealType(time),
    is_outside: false,
    logged_at: time,
  }
}

export default function MealSection({ meals, onChange }) {
  function addMeal() {
    onChange([...meals, emptyMeal()])
  }

  function updateMeal(key, updated) {
    const newMeals = meals.map(m => (m._key === key ? { ...updated, _key: key } : m))
    onChange(newMeals.sort((a, b) => (a.logged_at || '').localeCompare(b.logged_at || '')))
  }

  function removeMeal(key) {
    onChange(meals.filter(m => m._key !== key))
  }

  return (
    <div className="flex flex-col gap-3">
      {meals.map(m => (
        <MealEntry
          key={m._key}
          meal={m}
          onChange={updated => updateMeal(m._key, updated)}
          onRemove={() => removeMeal(m._key)}
        />
      ))}
      <button
        onClick={addMeal}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-600 font-medium text-sm active:bg-emerald-50 transition-colors"
      >
        + Add meal
      </button>
    </div>
  )
}
