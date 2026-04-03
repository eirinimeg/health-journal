import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ItemList({ items, onToggle, onDelete }) {
  if (!items.length) return <p className="text-gray-400 text-sm italic py-1">Nothing added yet.</p>
  return (
    <div className="flex flex-col gap-2">
      {items.map(v => (
        <div
          key={v.id}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
            v.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <button
            onClick={() => onToggle(v.id, v.active)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              v.active ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'
            }`}
          >
            {v.active && <span className="text-white text-xs">✓</span>}
          </button>
          <span className={`flex-1 font-medium ${v.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
            {v.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${v.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {v.active ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => onDelete(v.id)}
            className="text-gray-300 hover:text-red-400 transition-colors px-1 text-lg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function AddForm({ placeholder, onAdd }) {
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    setAdding(true)
    await onAdd(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-gray-800 placeholder-gray-400"
      />
      <button
        onClick={handleAdd}
        disabled={adding || !name.trim()}
        className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50 active:bg-emerald-700 transition-colors"
      >
        {adding ? '…' : 'Add'}
      </button>
    </div>
  )
}

export default function Settings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data } = await supabase.from('vitamins').select('*').order('sort_order').order('created_at')
    if (data) setItems(data)
    setLoading(false)
  }

  async function addItem(name, category) {
    const categoryItems = items.filter(i => i.category === category)
    const { error } = await supabase.from('vitamins').insert({
      name,
      active: true,
      sort_order: categoryItems.length,
      category,
    })
    if (!error) await loadAll()
    else alert('Error: ' + error.message)
  }

  async function toggleActive(id, current) {
    await supabase.from('vitamins').update({ active: !current }).eq('id', id)
    setItems(vs => vs.map(v => v.id === id ? { ...v, active: !current } : v))
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('vitamins').delete().eq('id', id)
    setItems(vs => vs.filter(v => v.id !== id))
  }

  const vitamins = items.filter(i => i.category === 'vitamin' || !i.category)
  const medicines = items.filter(i => i.category === 'medicine')

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Settings</h1>
      <p className="text-gray-400 text-sm mb-6">Manage your vitamins and medicine</p>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading…</div>
      ) : (
        <>
          {/* Vitamins section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">💊 Vitamins & Supplements</h2>
            <AddForm placeholder="e.g. Vitamin D3" onAdd={name => addItem(name, 'vitamin')} />
            <ItemList items={vitamins} onToggle={toggleActive} onDelete={deleteItem} />
          </div>

          {/* Medicine section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">💉 Medicine</h2>
            <AddForm placeholder="e.g. Ibuprofen" onAdd={name => addItem(name, 'medicine')} />
            <ItemList items={medicines} onToggle={toggleActive} onDelete={deleteItem} />
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Inactive items won't appear in daily logs
      </p>
    </div>
  )
}
