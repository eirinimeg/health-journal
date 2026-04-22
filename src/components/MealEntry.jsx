import { useState, useEffect, useRef } from 'react'
import { MEAL_LABELS, MEAL_EMOJI } from '../lib/mealUtils'
import { supabase } from '../lib/supabase'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealEntry({ meal, onChange, onRemove }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  // Fetch autocomplete suggestions when description changes
  useEffect(() => {
    const desc = meal.description?.trim()
    if (!desc || desc.length < 2) {
      setSuggestions([])
      return
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('meals')
        .select('description')
        .ilike('description', `%${desc}%`)
        .limit(6)

      if (data) {
        const unique = [...new Set(data.map(d => d.description))].filter(
          d => d.toLowerCase() !== desc.toLowerCase()
        )
        setSuggestions(unique)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [meal.description])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-2">
      {/* Description with autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={meal.description}
          onChange={e => onChange({ ...meal, description: e.target.value })}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="What did you eat?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-400"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  onMouseDown={() => onChange({ ...meal, description: s })}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 active:bg-emerald-100"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Meal type + time + outside toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Meal type selector */}
        <div className="flex gap-1">
          {MEAL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => onChange({ ...meal, meal_type: t })}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                meal.meal_type === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {MEAL_EMOJI[t]} {MEAL_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Time */}
        <input
          type="time"
          value={meal.logged_at}
          onChange={e => onChange({ ...meal, logged_at: e.target.value })}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700"
        />

        {/* Outside toggle */}
        <button
          onClick={() => onChange({ ...meal, is_outside: !meal.is_outside })}
          className={`ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            meal.is_outside
              ? 'bg-orange-100 border-orange-400 text-orange-700'
              : 'bg-gray-100 border-gray-200 text-gray-500'
          }`}
        >
          🍔 Outside
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 transition-colors px-1"
          aria-label="Remove meal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
