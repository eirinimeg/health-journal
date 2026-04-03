import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr } from '../lib/mealUtils'
import Section from '../components/Section'
import MoodSelector from '../components/MoodSelector'
import WaterInput from '../components/WaterInput'
import CoffeeCounter from '../components/CoffeeCounter'
import MealSection from '../components/MealSection'
import VitaminChecklist from '../components/VitaminChecklist'
import AlcoholSection from '../components/AlcoholSection'
import DessertSection from '../components/DessertSection'

function defaultState() {
  return {
    mood: null,
    water_ml: 0,
    coffee_count: 0,
    bowel_movement: false,
    period: false,
    migraine: false,
    notes: '',
  }
}

export default function Today() {
  const TODAY = todayStr()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [log, setLog] = useState(defaultState())
  const [meals, setMeals] = useState([])
  const [vitamins, setVitamins] = useState([])
  const [checkedVitamins, setCheckedVitamins] = useState([])
  const [alcohol, setAlcohol] = useState([])
  const [desserts, setDesserts] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const dateInputRef = useRef(null)

  const isToday = selectedDate === TODAY

  const loadData = useCallback(async () => {
    setLoading(true)
    setLog(defaultState())
    setMeals([])
    setAlcohol([])
    setDesserts([])
    setCheckedVitamins([])

    const [logRes, vitRes] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('date', selectedDate).maybeSingle(),
      supabase.from('vitamins').select('*').eq('active', true).order('sort_order'),
    ])

    if (vitRes.data) setVitamins(vitRes.data)

    if (logRes.data) {
      setLog({
        mood: logRes.data.mood,
        water_ml: logRes.data.water_ml || 0,
        coffee_count: logRes.data.coffee_count || 0,
        bowel_movement: logRes.data.bowel_movement || false,
        period: logRes.data.period || false,
        migraine: logRes.data.migraine || false,
        notes: logRes.data.notes || '',
      })

      const [mealsRes, alcRes, dessRes, vitLogRes] = await Promise.all([
        supabase.from('meals').select('*').eq('log_date', selectedDate).order('logged_at'),
        supabase.from('alcohol_entries').select('*').eq('log_date', selectedDate).order('logged_at'),
        supabase.from('dessert_entries').select('*').eq('log_date', selectedDate).order('logged_at'),
        supabase.from('vitamin_logs').select('*').eq('log_date', selectedDate),
      ])

      if (mealsRes.data) setMeals(mealsRes.data.map(m => ({ ...m, _key: m.id })))
      if (alcRes.data) setAlcohol(alcRes.data.map(a => ({ ...a, _key: a.id })))
      if (dessRes.data) setDesserts(dessRes.data.map(d => ({ ...d, _key: d.id })))
      if (vitLogRes.data) setCheckedVitamins(vitLogRes.data.filter(v => v.taken).map(v => v.vitamin_id))
    }
    setLoading(false)
  }, [selectedDate])

  useEffect(() => { loadData() }, [loadData])

  async function save() {
    setSaving(true)
    try {
      const { error: logErr } = await supabase.from('daily_logs').upsert(
        { date: selectedDate, ...log },
        { onConflict: 'date' }
      )
      if (logErr) throw logErr

      await supabase.from('meals').delete().eq('log_date', selectedDate)
      const validMeals = meals.filter(m => m.description.trim())
      if (validMeals.length > 0) {
        await supabase.from('meals').insert(
          validMeals.map(({ _key, id, ...m }) => ({ ...m, log_date: selectedDate }))
        )
      }

      await supabase.from('alcohol_entries').delete().eq('log_date', selectedDate)
      const validAlc = alcohol.filter(a => a.description.trim())
      if (validAlc.length > 0) {
        await supabase.from('alcohol_entries').insert(
          validAlc.map(({ _key, id, ...a }) => ({ ...a, log_date: selectedDate }))
        )
      }

      await supabase.from('dessert_entries').delete().eq('log_date', selectedDate)
      const validDess = desserts.filter(d => d.description.trim())
      if (validDess.length > 0) {
        await supabase.from('dessert_entries').insert(
          validDess.map(({ _key, id, ...d }) => ({ ...d, log_date: selectedDate }))
        )
      }

      await supabase.from('vitamin_logs').delete().eq('log_date', selectedDate)
      if (vitamins.length > 0) {
        await supabase.from('vitamin_logs').insert(
          vitamins.map(v => ({
            log_date: selectedDate,
            vitamin_id: v.id,
            taken: checkedVitamins.includes(v.id),
          }))
        )
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDateChange(e) {
    const val = e.target.value
    if (!val || val > TODAY) return
    setSelectedDate(val)
  }

  const displayDate = isToday
    ? new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-pulse">🌿</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isToday ? "Today's Journal" : 'Past Entry'}
            </h1>
            <p className="text-gray-400 text-sm">{displayDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={() => setSelectedDate(TODAY)}
                className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold active:bg-emerald-600 transition-colors shadow-sm"
              >
                Today
              </button>
            )}
            <button
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-xl active:bg-gray-200 transition-colors"
              title="Pick a date"
            >
              📅
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={TODAY}
              onChange={handleDateChange}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Section title="Mood" emoji="💭">
          <MoodSelector value={log.mood} onChange={mood => setLog(l => ({ ...l, mood }))} />
        </Section>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Water" emoji="💧">
            <WaterInput value={log.water_ml} onChange={v => setLog(l => ({ ...l, water_ml: v }))} />
          </Section>
          <Section title="Coffee" emoji="☕">
            <CoffeeCounter value={log.coffee_count} onChange={v => setLog(l => ({ ...l, coffee_count: v }))} />
          </Section>
        </div>

        <Section title="Meals" emoji="🍽️">
          <MealSection meals={meals} onChange={setMeals} />
        </Section>

        <Section title="Vitamins" emoji="💊">
          <VitaminChecklist
            vitamins={vitamins.filter(v => v.category === 'vitamin' || !v.category)}
            checked={checkedVitamins}
            onChange={setCheckedVitamins}
          />
        </Section>

        <Section title="Medicine" emoji="💉">
          <VitaminChecklist
            vitamins={vitamins.filter(v => v.category === 'medicine')}
            checked={checkedVitamins}
            onChange={setCheckedVitamins}
          />
        </Section>

        <div className="grid grid-cols-3 gap-3">
          <Section title="Bowel" emoji="💩">
            <button
              onClick={() => setLog(l => ({ ...l, bowel_movement: !l.bowel_movement }))}
              className={`w-full py-4 rounded-xl text-2xl border-2 transition-all ${
                log.bowel_movement
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'bg-white border-gray-200'
              }`}
            >
              {log.bowel_movement ? '✅' : '⬜'}
            </button>
          </Section>
          <Section title="Period" emoji="🩸">
            <button
              onClick={() => setLog(l => ({ ...l, period: !l.period }))}
              className={`w-full py-4 rounded-xl text-2xl border-2 transition-all ${
                log.period
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              {log.period ? '🩸' : '⬜'}
            </button>
          </Section>
          <Section title="Migraine" emoji="🧠">
            <button
              onClick={() => setLog(l => ({ ...l, migraine: !l.migraine }))}
              className={`w-full py-4 rounded-xl text-2xl border-2 transition-all ${
                log.migraine
                  ? 'bg-purple-50 border-purple-400'
                  : 'bg-white border-gray-200'
              }`}
            >
              {log.migraine ? '✅' : '⬜'}
            </button>
          </Section>
        </div>

        <Section title="Alcohol" emoji="🍷">
          <AlcoholSection entries={alcohol} onChange={setAlcohol} />
        </Section>

        <Section title="Desserts" emoji="🍰">
          <DessertSection entries={desserts} onChange={setDesserts} />
        </Section>

        <Section title="Notes" emoji="📝">
          <textarea
            value={log.notes}
            onChange={e => setLog(l => ({ ...l, notes: e.target.value }))}
            placeholder="Anything else to note..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-400 resize-none"
          />
        </Section>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={save}
            disabled={saving}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all ${
              saved
                ? 'bg-emerald-500'
                : saving
                ? 'bg-gray-400'
                : 'bg-emerald-600 active:bg-emerald-700'
            }`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : isToday ? 'Save Journal' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
