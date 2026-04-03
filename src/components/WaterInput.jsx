export default function WaterInput({ value, onChange }) {
  function add(ml) {
    onChange(Math.max(0, (value || 0) + ml))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="50"
          value={value || ''}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
          className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-center text-lg font-semibold"
        />
        <span className="text-gray-500 text-sm">ml</span>
      </div>
      <div className="flex gap-2">
        {[250, 500, 1000].map(ml => (
          <button
            key={ml}
            onClick={() => add(ml)}
            className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 active:bg-blue-100"
          >
            +{ml >= 1000 ? '1L' : `${ml}ml`}
          </button>
        ))}
        <button
          onClick={() => onChange(0)}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm border border-gray-200 active:bg-gray-200"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
