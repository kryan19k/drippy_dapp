import React, { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const shouldUseSidebar = !isLandingPage

  return (
    <div className="min-h-screen bg-background theme-transition">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/3 via-background to-secondary/5 pointer-events-none" />
      
      {/* Navigation */}
      <Navigation layout={shouldUseSidebar ? 'sidebar' : 'top'} />

      {/* Main Content */}
      <main
        className={`relative z-10 theme-transition ${
          shouldUseSidebar
            ? 'lg:ml-72 lg:pt-0 pt-16' // Sidebar layout: left margin for sidebar, top padding for mobile header
            : '' // Top nav layout: no margins
        } ${
          !isLandingPage
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
            : ''
        }`}
      >
        {children}
      </main>
    </div>
  )
}

export default Layout
