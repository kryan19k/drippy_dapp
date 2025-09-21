import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor, ChevronDown, Sunset } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const themes = [
  { value: 'light' as const, label: 'Light', icon: Sun, description: 'Bright aqua theme' },
  { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Deep ocean theme' },
  { value: 'dim' as const, label: 'Dim', icon: Sunset, description: 'Twilight blue theme' },
  { value: 'system' as const, label: 'System', icon: Monitor, description: 'Follow system' },
]

const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  const currentTheme = themes.find(t => t.value === theme) || themes[1]
  const CurrentIcon = currentTheme.icon

  const handleThemeChange = (newTheme: typeof theme) => {
    console.log('Theme change requested:', newTheme)
    setTheme(newTheme)
    setIsOpen(false)
  }

  const handleToggle = () => {
    console.log('Theme picker toggle:', !isOpen)
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const dropdownContent = isOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full right-0 mt-2 w-56 glass rounded-lg border border-border backdrop-blur-xl shadow-xl z-[9999]"
      >
        <div className="p-2">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            return (
              <motion.button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  theme === themeOption.value
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{themeOption.label}</div>
                    <div className="text-xs opacity-70">{themeOption.description}</div>
                  </div>
                </div>
                {theme === themeOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </>
  )

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={handleToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg glass border border-border hover:border-primary/40 text-foreground/90 hover:text-foreground transition-all duration-300 backdrop-blur-xl text-xs hover:shadow-lg"
      >
        <CurrentIcon className="w-3 h-3" />
        <ChevronDown className={`w-2 h-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {dropdownContent}
      </AnimatePresence>
    </div>
  )
}

export default ThemePicker