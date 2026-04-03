const MOODS = [
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 1, emoji: '😢', label: 'Bad' },
]

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {MOODS.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(value === m.value ? null : m.value)}
          className={`flex-1 py-4 rounded-2xl text-4xl flex flex-col items-center gap-1 transition-all border-2 ${
            value === m.value
              ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105'
              : 'border-gray-200 bg-white'
          }`}
        >
          {m.emoji}
          <span className="text-xs text-gray-500 font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
