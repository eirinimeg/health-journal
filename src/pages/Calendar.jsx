import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid = []
  let day = 1 - startOffset
  while (day <= daysInMonth) {
    const week = []
    for (let d = 0; d < 7; d++, day++) {
      if (day < 1 || day > daysInMonth) week.push(null)
      else week.push(day)
    }
    grid.push(week)
  }
  return grid
}

function pad(n) { return String(n).padStart(2, '0') }

export default function Calendar() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [logs, setLogs] = useState({})
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  useEffect(() => {
    async function load() {
      const from = `${year}-${pad(month + 1)}-01`
      const to = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`

      const [logsRes, mealsRes, lateRes, alcRes, dessRes] = await Promise.all([
        supabase.from('daily_logs').select('date,mood,bowel_movement,period,migraine,water_ml').gte('date', from).lte('date', to),
        supabase.from('meals').select('log_date').eq('is_outside', true).gte('log_date', from).lte('log_date', to),
        supabase.from('meals').select('log_date').gte('logged_at', '22:00:00').gte('log_date', from).lte('log_date', to),
        supabase.from('alcohol_entries').select('log_date').gte('log_date', from).lte('log_date', to),
        supabase.from('dessert_entries').select('log_date').gte('log_date', from).lte('log_date', to),
      ])

      const map = {}
      if (logsRes.data) {
        logsRes.data.forEach(l => {
          map[l.date] = { mood: l.mood, bowel: l.bowel_movement, period: l.period, migraine: l.migraine, water_ml: l.water_ml || 0, outside: false, lateMeal: false, alcohol: false, dessert: false }
        })
      }
      if (mealsRes.data) {
        mealsRes.data.forEach(m => {
          if (map[m.log_date]) map[m.log_date].outside = true
          else map[m.log_date] = { outside: true, lateMeal: false, alcohol: false, dessert: false }
        })
      }
      if (lateRes.data) {
        lateRes.data.forEach(m => {
          if (map[m.log_date]) map[m.log_date].lateMeal = true
          else map[m.log_date] = { outside: false, lateMeal: true, alcohol: false, dessert: false }
        })
      }
      if (alcRes.data) {
        alcRes.data.forEach(a => {
          if (map[a.log_date]) map[a.log_date].alcohol = true
          else map[a.log_date] = { outside: false, lateMeal: false, alcohol: true, dessert: false }
        })
      }
      if (dessRes.data) {
        dessRes.data.forEach(d => {
          if (map[d.log_date]) map[d.log_date].dessert = true
          else map[d.log_date] = { outside: false, lateMeal: false, alcohol: false, dessert: true }
        })
      }
      setLogs(map)
    }
    load()
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const grid = getMonthGrid(year, month)
  const monthName = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const MOOD_EMOJI = { 3: '😊', 2: '😐', 1: '😢' }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-600 text-xl active:bg-gray-100">‹</button>
        <h1 className="text-lg font-bold text-gray-800">{monthName}</h1>
        <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-gray-600 text-xl active:bg-gray-100">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-1">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) return <div key={di} />
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
              const info = logs[dateStr]
              const isToday = dateStr === todayStr
              const isClean = info && !info.outside && !info.lateMeal && !info.alcohol && !info.dessert && info.water_ml >= 2000
              const isIndulgent = info && (info.outside || info.lateMeal || info.alcohol || info.dessert || info.water_ml < 2000)

              return (
                <button
                  key={di}
                  onClick={() => navigate(dateStr === todayStr ? '/' : `/day/${dateStr}`)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all active:scale-95 ${
                    isIndulgent ? 'bg-orange-100 border border-orange-300' :
                    isClean ? 'bg-green-100 border border-green-300' :
                    'bg-gray-50 border border-gray-100'
                  } ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>{day}</span>
                  {info?.mood && <span className="text-xs leading-none">{MOOD_EMOJI[info.mood]}</span>}
                  <div className="flex gap-px flex-wrap justify-center">
                    {info?.bowel && <span className="text-xs leading-none">💩</span>}
                    {info?.period && <span className="text-xs leading-none">🩸</span>}
                    {info?.migraine && <span className="text-xs leading-none">🧠</span>}
                    {info?.alcohol && <span className="text-xs leading-none">🍷</span>}
                    {info?.dessert && <span className="text-xs leading-none">🍰</span>}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block"></span>Clean day</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block"></span>Outside / late meal / alcohol / dessert / water &lt;2L</span>
        <span>💩 Bowel</span>
        <span>🩸 Period</span>
        <span>🧠 Migraine</span>
        <span>🍷 Alcohol</span>
        <span>🍰 Dessert</span>
      </div>
    </div>
  )
}
