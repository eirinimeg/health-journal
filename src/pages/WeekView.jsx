import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar,
} from 'recharts'
import { supabase } from '../lib/supabase'

const MOOD_EMOJI = { 3: '😊', 2: '😐', 1: '😢' }
const MOOD_LABEL = { 3: 'Good', 2: 'Okay', 1: 'Bad' }

function pad(n) { return String(n).padStart(2, '0') }

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const MEAL_TYPE_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

const ROWS = [
  { key: 'allMeals',      label: 'Meals',    type: 'allMeals' },
  { key: 'desserts',      label: 'Desserts', type: 'list' },
  { key: 'alcohol',       label: 'Alcohol',  type: 'list' },
  { key: 'vitamins',      label: 'Vitamins', type: 'vitamins', category: 'vitamin' },
  { key: 'medicine',      label: 'Medicine', type: 'medicine' },
  { key: 'mood',          label: 'Mood',     type: 'mood' },
  { key: 'bowel_movement',label: 'Bowel',    type: 'indicator', emoji: '💩' },
  { key: 'period',        label: 'Period',   type: 'indicator', emoji: '🩸' },
  { key: 'migraine',      label: 'Migraine', type: 'indicator', emoji: '🧠' },
  { key: 'water_ml',      label: 'Water',    type: 'water' },
  { key: 'coffee_count',  label: 'Coffee',   type: 'number' },
  { key: 'notes',         label: 'Notes',    type: 'text' },
]

const EMPTY = <span className="text-zinc-700 text-xs select-none">·</span>

function renderCell(row, day) {
  switch (row.type) {
    case 'allMeals': {
      const items = day.allMeals || []
      if (!items.length) return EMPTY
      return (
        <div className="text-left space-y-0.5">
          {items.map((m, i) => (
            <div
              key={i}
              className={`text-xs leading-tight px-1 py-px rounded ${
                m.is_outside ? 'bg-orange-500/20 text-orange-300' : 'text-zinc-200'
              }`}
            >
              {MEAL_TYPE_EMOJI[m.meal_type]} {m.description}
            </div>
          ))}
        </div>
      )
    }
    case 'list': {
      const items = day[row.key] || []
      if (!items.length) return EMPTY
      return (
        <div className="text-left space-y-0.5">
          {items.map((item, i) => (
            <div key={i} className="text-xs text-zinc-200 leading-tight">{item}</div>
          ))}
        </div>
      )
    }
    case 'vitamins': {
      const taken = day.vitaminsTaken
      const total = day.totalVitamins
      if (total === 0) return EMPTY
      const color = taken === total ? 'text-emerald-400' : 'text-amber-400'
      return <span className={`text-xs font-semibold ${color}`}>{taken}/{total}</span>
    }
    case 'medicine': {
      const taken = day.medicineTaken
      const total = day.totalMedicine
      if (total === 0) return EMPTY
      // green = none taken (feeling well), orange = at least one taken
      const color = taken === 0 ? 'text-emerald-400' : 'text-orange-400'
      return <span className={`text-xs font-semibold ${color}`}>{taken}/{total}</span>
    }
    case 'mood':
      return day.mood
        ? <span className="text-base">{MOOD_EMOJI[day.mood]}</span>
        : EMPTY
    case 'indicator':
      return day[row.key]
        ? <span className="text-base leading-none">{row.emoji}</span>
        : EMPTY
    case 'water':
      if (!day.water_ml) return EMPTY
      return (
        <span className={`text-xs font-medium ${day.water_ml >= 2000 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {day.water_ml >= 1000 ? `${(day.water_ml / 1000).toFixed(1)}L` : `${day.water_ml}ml`}
        </span>
      )
    case 'number':
      return day[row.key]
        ? <span className="text-xs font-medium text-zinc-300">{day[row.key]}</span>
        : EMPTY
    case 'text':
      if (!day[row.key]) return EMPTY
      return <span className="text-xs text-zinc-400 text-left block leading-tight">{day[row.key]}</span>
    default:
      return null
  }
}

export default function WeekView() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()))
  const [data, setData] = useState([])
  const todayStr = formatDate(new Date())

  useEffect(() => {
    async function load() {
      const from = formatDate(weekStart)
      const to = formatDate(addDays(weekStart, 6))

      const [logsRes, mealsRes, alcRes, dessRes, vitLogsRes, vitRes] = await Promise.all([
        supabase.from('daily_logs').select('*').gte('date', from).lte('date', to),
        supabase.from('meals').select('log_date,description,meal_type,is_outside').gte('log_date', from).lte('log_date', to).order('logged_at'),
        supabase.from('alcohol_entries').select('log_date,description').gte('log_date', from).lte('log_date', to),
        supabase.from('dessert_entries').select('log_date,description').gte('log_date', from).lte('log_date', to),
        supabase.from('vitamin_logs').select('log_date,vitamin_id,taken').eq('taken', true).gte('log_date', from).lte('log_date', to),
        supabase.from('vitamins').select('id,name,category').eq('active', true).order('sort_order'),
      ])

      const vitMap = {}
      vitRes.data?.forEach(v => { vitMap[v.id] = { name: v.name, category: v.category } })
      const totalVitamins = vitRes.data?.filter(v => v.category === 'vitamin' || !v.category).length || 0
      const totalMedicine = vitRes.data?.filter(v => v.category === 'medicine').length || 0

      const mealsByDate = {}
      mealsRes.data?.forEach(m => {
        if (!mealsByDate[m.log_date]) mealsByDate[m.log_date] = []
        mealsByDate[m.log_date].push({ description: m.description, meal_type: m.meal_type, is_outside: m.is_outside, logged_at: m.logged_at })
      })

      const alcByDate = {}
      alcRes.data?.forEach(a => {
        if (!alcByDate[a.log_date]) alcByDate[a.log_date] = []
        alcByDate[a.log_date].push(a.description)
      })

      const dessByDate = {}
      dessRes.data?.forEach(d => {
        if (!dessByDate[d.log_date]) dessByDate[d.log_date] = []
        dessByDate[d.log_date].push(d.description)
      })

      const vitTakenByDate = {}   // date → count of vitamins taken
      const medTakenByDate = {}   // date → count of medicine taken
      vitLogsRes.data?.forEach(vl => {
        const entry = vitMap[vl.vitamin_id]
        if (!entry) return
        const isMed = entry.category === 'medicine'
        if (isMed) {
          medTakenByDate[vl.log_date] = (medTakenByDate[vl.log_date] || 0) + 1
        } else {
          vitTakenByDate[vl.log_date] = (vitTakenByDate[vl.log_date] || 0) + 1
        }
      })

      const logMap = {}
      logsRes.data?.forEach(l => { logMap[l.date] = l })

      const days = []
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i)
        const dateStr = formatDate(d)
        const log = logMap[dateStr]
        days.push({
          dateStr,
          dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
          dayNum: d.getDate(),
          mood: log?.mood ?? null,
          bowel_movement: log?.bowel_movement ?? false,
          period: log?.period ?? false,
          migraine: log?.migraine ?? false,
          water_ml: log?.water_ml ?? 0,
          coffee_count: log?.coffee_count ?? 0,
          notes: log?.notes ?? '',
          allMeals: mealsByDate[dateStr] || [],
          alcohol: alcByDate[dateStr] || [],
          desserts: dessByDate[dateStr] || [],
          vitaminsTaken: vitTakenByDate[dateStr] || 0,
          medicineTaken: medTakenByDate[dateStr] || 0,
          totalVitamins,
          totalMedicine,
        })
      }
      setData(days)
    }
    load()
  }, [weekStart])

  function prevWeek() { setWeekStart(d => addDays(d, -7)) }
  function nextWeek() { setWeekStart(d => addDays(d, 7)) }

  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const moodChartData = data.map(d => ({
    day: d.dayName,
    mood: d.mood,
    bowel:    d.bowel_movement ? 0.65 : null,
    period:   d.period         ? 0.45 : null,
    migraine: d.migraine       ? 0.25 : null,
  }))
  const waterChartData = data.map(d => ({ day: d.dayName, water: d.water_ml }))

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevWeek} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-xl text-gray-600 active:bg-gray-100">‹</button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">Week Overview</h1>
          <p className="text-sm text-gray-400">{weekLabel}</p>
        </div>
        <button onClick={nextWeek} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-xl text-gray-600 active:bg-gray-100">›</button>
      </div>

      {/* Main data table */}
      <div className="bg-zinc-900 rounded-2xl shadow-lg mb-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 500 }}>
            <thead>
              <tr className="bg-zinc-800 border-b border-zinc-700">
                <th className="sticky left-0 bg-zinc-800 w-20 min-w-[80px] px-2 py-3 border-r border-zinc-700 z-10" />
                {data.map(d => {
                  const isToday = d.dateStr === todayStr
                  return (
                    <th key={d.dateStr} className="px-1 py-2 min-w-[68px] text-center">
                      <button
                        onClick={() => navigate(d.dateStr === todayStr ? '/' : `/day/${d.dateStr}`)}
                        className="w-full"
                      >
                        <div className={`text-xs font-semibold ${isToday ? 'text-emerald-400' : 'text-zinc-400'}`}>{d.dayName}</div>
                        <div className={`text-sm font-bold ${isToday ? 'text-emerald-300' : 'text-zinc-100'}`}>{d.dayNum}</div>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => {
                const rowBg = ri % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/60'
                return (
                  <tr key={row.key} className={rowBg}>
                    <td className={`sticky left-0 ${rowBg} px-2 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-r border-zinc-700 whitespace-nowrap z-10`}>
                      {row.label}
                    </td>
                    {data.map(d => (
                      <td key={d.dateStr} className="px-1.5 py-2 align-top border-l border-zinc-700/40">
                        {renderCell(row, d)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mood trend chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Mood Trend</h2>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-emerald-500 rounded"></span>Mood</span>
          <span>💩 Bowel</span>
          <span>🩸 Period</span>
          <span>🧠 Migraine</span>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={moodChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 3.2]}
              ticks={[1, 2, 3]}
              tickFormatter={v => MOOD_EMOJI[v] || ''}
              tick={{ fontSize: 14 }}
            />
            {/* separator between mood zone and indicator zone */}
            <ReferenceLine y={0.85} stroke="#e5e7eb" strokeDasharray="4 3" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const items = payload.filter(p => p.value != null)
                if (!items.length) return null
                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
                    <p className="font-semibold text-gray-500 mb-1">{label}</p>
                    {items.map(p => {
                      let label
                      if (p.dataKey === 'mood')     label = `${MOOD_EMOJI[p.value]} ${MOOD_LABEL[p.value]}`
                      else if (p.dataKey === 'bowel')    label = '💩 Bowel'
                      else if (p.dataKey === 'period')   label = '🩸 Period'
                      else if (p.dataKey === 'migraine') label = '🧠 Migraine'
                      else label = p.value
                      return <p key={p.dataKey} className="text-gray-700">{label}</p>
                    })}
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#10b981' }}
              connectNulls={false}
            />
            {[
              { key: 'bowel',    emoji: '💩' },
              { key: 'period',   emoji: '🩸' },
              { key: 'migraine', emoji: '🧠' },
            ].map(({ key, emoji }) => (
              <Line
                key={key}
                dataKey={key}
                stroke="none"
                strokeWidth={0}
                connectNulls={false}
                activeDot={false}
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, value } = props
                  if (value == null || !cx || isNaN(cy)) return <g key={`${key}-${props.index}`} />
                  return (
                    <text
                      key={`${key}-${props.index}`}
                      x={cx} y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={16}
                    >
                      {emoji}
                    </text>
                  )
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Water bar chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">💧 Water Intake</h2>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={waterChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => v >= 1000 ? `${v / 1000}L` : `${v}`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [`${v}ml`, 'Water']} />
            <Bar dataKey="water" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
