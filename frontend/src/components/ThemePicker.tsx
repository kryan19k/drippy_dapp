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

interface ThemePickerProps {
  compact?: boolean
  position?: 'normal' | 'bottom'
  sidebarCollapsed?: boolean
}

const ThemePicker: React.FC<ThemePickerProps> = ({ compact = false, position = 'normal', sidebarCollapsed = false }) => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const currentTheme = themes.find(t => t.value === theme) || themes[1]
  const CurrentIcon = currentTheme.icon

  const handleThemeChange = (newTheme: typeof theme) => {
    console.log('Theme change requested:', newTheme)
    setTheme(newTheme)
    setIsOpen(false)
  }

  const handleToggle = () => {
    console.log('Theme picker toggle:', !isOpen, { compact, position, sidebarCollapsed })
    setIsOpen(!isOpen)
  }

  // Debug render
  console.log('ThemePicker render:', { isOpen, compact, position, sidebarCollapsed })


    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        const buttonClicked = buttonRef.current?.contains(target)
        const dropdownClicked = document.querySelector('[data-theme-dropdown]')?.contains(target)

        // Only close if clicking outside both button and dropdown
        if (!buttonClicked && !dropdownClicked) {
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

  const DropdownContent = () => (
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
  )

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={handleToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center rounded-lg glass border text-foreground/90 transition-all duration-300 backdrop-blur-xl hover:shadow-lg cursor-pointer ${
          isOpen
            ? 'border-primary/60 bg-primary/10'
            : 'border-border hover:border-primary/40 hover:text-foreground'
        } ${
          compact && sidebarCollapsed && position === 'bottom'
            ? 'w-12 h-12 p-2 justify-center'
            : compact
            ? 'w-8 h-8 p-1 justify-center'
            : 'space-x-1 px-2 py-1.5 text-xs'
        }`}
      >
        <CurrentIcon className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[9998] ${sidebarCollapsed && position === 'bottom' ? 'bg-black/50' : ''}`}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{
                opacity: 0,
                scale: 0.9
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              data-theme-dropdown
              className={`glass rounded-xl border border-border backdrop-blur-xl shadow-2xl ${
                position === 'bottom'
                  ? 'absolute z-[9999] w-48 bottom-full left-0 mb-2'
                  : compact
                  ? 'absolute z-[9999] w-48 top-full left-0 mt-2'
                  : 'absolute z-[9999] w-56 top-full right-0 mt-2'
              }`}
            >
              <DropdownContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemePicker