import { nowTimeStr } from '../lib/mealUtils'

function emptyEntry() {
  return { _key: crypto.randomUUID(), id: null, description: '', logged_at: nowTimeStr() }
}

export default function AlcoholSection({ entries, onChange }) {
  function add() { onChange([...entries, emptyEntry()]) }
  function update(key, field, val) {
    onChange(entries.map(e => e._key === key ? { ...e, [field]: val } : e))
  }
  function remove(key) { onChange(entries.filter(e => e._key !== key)) }

  return (
    <div className="flex flex-col gap-2">
      {entries.map(e => (
        <div key={e._key} className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
          <input
            type="text"
            value={e.description}
            onChange={ev => update(e._key, 'description', ev.target.value)}
            placeholder="e.g. 1 glass of wine"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <input
            type="time"
            value={e.logged_at}
            onChange={ev => update(e._key, 'logged_at', ev.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600"
          />
          <button onClick={() => remove(e._key)} className="text-gray-300 hover:text-red-400 transition-colors px-1">✕</button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-medium active:bg-purple-50 transition-colors"
      >
        + Add drink
      </button>
    </div>
  )
}
