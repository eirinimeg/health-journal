import { useState, useEffect } from 'react'

const CORRECT_PIN = import.meta.env.VITE_APP_PIN || '1234'
const SESSION_KEY = 'hj_pin_ok'

export default function PinGuard({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setUnlocked(true)
    }
  }, [])

  function handleDigit(d) {
    const next = input + d
    setInput(next)
    setError(false)

    if (next.length === CORRECT_PIN.length) {
      if (next === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        setUnlocked(true)
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setInput('')
          setShake(false)
        }, 600)
      }
    }
  }

  function handleDelete() {
    setInput(i => i.slice(0, -1))
    setError(false)
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🌿</div>
      <h1 className="text-2xl font-bold text-emerald-800 mb-2">Health Journal</h1>
      <p className="text-gray-500 mb-8">Enter your PIN to continue</p>

      {/* Dots */}
      <div className={`flex gap-4 mb-8 ${shake ? 'animate-bounce' : ''}`}>
        {Array.from({ length: CORRECT_PIN.length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < input.length
                ? error ? 'bg-red-500 border-red-500' : 'bg-emerald-600 border-emerald-600'
                : 'border-gray-400 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">Incorrect PIN, try again</p>}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-72">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => {
          if (key === '') return <div key={i} />
          return (
            <button
              key={i}
              onClick={() => key === '⌫' ? handleDelete() : handleDigit(key)}
              className="h-16 rounded-2xl bg-white shadow text-xl font-semibold text-gray-800 active:bg-emerald-100 transition-colors"
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
