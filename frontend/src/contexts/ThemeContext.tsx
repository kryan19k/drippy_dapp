import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'dim' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark' | 'dim'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark' | 'dim'>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('drippy-theme') as Theme
      if (stored && ['light', 'dark', 'dim', 'system'].includes(stored)) {
        setTheme(stored)
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'dim')

    let resolvedTheme: 'light' | 'dark' | 'dim'

    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolvedTheme = theme as 'light' | 'dark' | 'dim'
    }

    root.classList.add(resolvedTheme)
    setActualTheme(resolvedTheme)
    
    try {
      localStorage.setItem('drippy-theme', theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}