'use client'

import { useSidebar } from './SidebarContext'

export default function AdminNavbar() {
  const { toggleSidebar } = useSidebar()

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 border-b border-blue-900 flex items-center px-4 z-40 shadow-lg">
      <div className="flex items-center gap-4 w-full text-white">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-blue-600/30 rounded-lg transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <h1 className="text-xl font-semibold">
          Admin Dashboard
        </h1>
      </div>
    </nav>
  )
}
