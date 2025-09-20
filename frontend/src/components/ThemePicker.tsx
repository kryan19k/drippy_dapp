import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const themes = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  const currentTheme = themes.find(t => t.value === theme) || themes[1]
  const CurrentIcon = currentTheme.icon

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  const dropdownContent = isOpen && buttonRect && (
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
        className="fixed z-[9999] w-32 glass rounded-lg border border-white/20 backdrop-blur-xl shadow-xl"
        style={{
          top: buttonRect.bottom + 8,
          right: window.innerWidth - buttonRect.right,
        }}
      >
        <div className="p-2">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            return (
              <motion.button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value)
                  setIsOpen(false)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                  theme === themeOption.value
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{themeOption.label}</span>
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
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center space-x-1 px-2 py-1.5 rounded-lg glass border border-white/20 hover:border-white/40 text-white/90 hover:text-white transition-all duration-300 backdrop-blur-xl text-xs"
      >
        <CurrentIcon className="w-3 h-3" />
        <ChevronDown className={`w-2 h-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {dropdownContent && createPortal(dropdownContent, document.body)}
      </AnimatePresence>
    </div>
  )
}

export default ThemePicker