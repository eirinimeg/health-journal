export default function CoffeeCounter({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(0, (value || 0) - 1))}
        className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 text-2xl font-bold flex items-center justify-center active:bg-amber-200 border border-amber-200"
      >
        −
      </button>
      <div className="flex flex-col items-center min-w-[3rem]">
        <span className="text-3xl font-bold text-gray-800">{value || 0}</span>
        <span className="text-xs text-gray-400">cups</span>
      </div>
      <button
        onClick={() => onChange((value || 0) + 1)}
        className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 text-2xl font-bold flex items-center justify-center active:bg-amber-200 border border-amber-200"
      >
        +
      </button>
    </div>
  )
}
