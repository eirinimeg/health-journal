export default function VitaminChecklist({ vitamins, checked, onChange }) {
  if (!vitamins || vitamins.length === 0) {
    return (
      <p className="text-gray-400 text-sm italic">
        No vitamins configured. Add them in Settings.
      </p>
    )
  }

  function toggle(id) {
    const next = checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {vitamins.map(v => {
        const isTaken = checked.includes(v.id)
        return (
          <button
            key={v.id}
            onClick={() => toggle(v.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
              isTaken
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              isTaken ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
            }`}>
              {isTaken && <span className="text-white text-xs">✓</span>}
            </span>
            <span className={`font-medium ${isTaken ? 'text-emerald-700' : 'text-gray-700'}`}>
              {v.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
