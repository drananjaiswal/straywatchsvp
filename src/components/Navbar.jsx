// straywatchsvp/src/components/Navbar.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ onReportClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
        pathname === to
          ? 'bg-green-100 text-green-800'
          : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-green-600 text-xl">🐕</span>
          <span className="font-semibold text-gray-800 text-sm">StrayWatch <span className="text-green-600">SVP</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLink('/', 'Home')}
          {navLink('/map', 'Heatmap')}
          {navLink('/about', 'About')}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded text-gray-500 hover:bg-gray-100"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-0.5 bg-current mb-1"></div>
          <div className="w-5 h-0.5 bg-current mb-1"></div>
          <div className="w-5 h-0.5 bg-current"></div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 px-4 pb-3 pt-2 flex flex-col gap-1 bg-white">
          {navLink('/', 'Home')}
          {navLink('/map', 'Heatmap')}
          {navLink('/about', 'About')}
        </div>
      )}
    </nav>
  )
}
