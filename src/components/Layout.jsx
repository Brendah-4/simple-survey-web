import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/surveys', label: 'Surveys' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/responses', label: 'Responses' },
];

const userLinks = [
  { to: '/surveys', label: 'Available Surveys' },
];

const allLinks = [
  { to: '/admin/surveys', label: 'Surveys', tag: 'Admin' },
  { to: '/admin/questions', label: 'Questions', tag: 'Admin' },
  { to: '/admin/responses', label: 'Responses', tag: 'Admin' },
  { to: '/surveys', label: 'Available Surveys', tag: 'User' },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-700 text-white shadow sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">SimpleSurvey</span>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 items-center">
            <span className="text-indigo-300 text-sm self-center mr-2">Admin:</span>
            {adminLinks.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-600'}`
                }>{l.label}</NavLink>
            ))}
            <span className="text-indigo-300 text-sm self-center ml-4 mr-2">User:</span>
            {userLinks.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-600'}`
                }>{l.label}</NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-indigo-600 transition-colors"
            onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <div className="w-5 h-0.5 bg-white mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-indigo-800 px-4 pb-4">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest pt-3 pb-1">Admin</p>
            {adminLinks.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${isActive ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-700'}`
                }>{l.label}</NavLink>
            ))}
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest pt-3 pb-1">User</p>
            {userLinks.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${isActive ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-700'}`
                }>{l.label}</NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
