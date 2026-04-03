import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import PinGuard from './components/PinGuard'
import Today from './pages/Today'
import DayLog from './pages/DayLog'
import Calendar from './pages/Calendar'
import WeekView from './pages/WeekView'
import Settings from './pages/Settings'

function NavBar() {
  const base = 'flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors'
  const active = 'text-emerald-600'
  const inactive = 'text-gray-500'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-inset-bottom">
      <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-2xl">📓</span>
        Today
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-2xl">📅</span>
        Calendar
      </NavLink>
      <NavLink to="/week" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-2xl">📊</span>
        Week
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-2xl">⚙️</span>
        Settings
      </NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PinGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/day/:date" element={<DayLog />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <NavBar />
      </PinGuard>
    </BrowserRouter>
  )
}
