import React from 'react'
import { motion } from 'framer-motion'
import { Palette, Sun, Moon, Sunset } from 'lucide-react'

const ThemeDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">DRIPPY Theme System</h2>
        <p className="text-muted-foreground">Showcasing the new brand-aligned color themes</p>
      </div>

      {/* Color Palette */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Colors */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-elevated p-6 rounded-xl theme-transition"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Brand Colors</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-primary drip-glow"></div>
              <span className="text-sm text-card-foreground font-medium">Primary Cyan</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg" style={{backgroundColor: 'hsl(var(--drippy-navy))'}}></div>
              <span className="text-sm text-card-foreground font-medium">Navy Blue</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-accent"></div>
              <span className="text-sm text-card-foreground font-medium">Accent Yellow</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-destructive"></div>
              <span className="text-sm text-card-foreground font-medium">Alert Red</span>
            </div>
          </div>
        </motion.div>

        {/* Theme Colors */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-elevated p-6 rounded-xl theme-transition"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Sun className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Theme Colors</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-primary"></div>
              <span className="text-sm text-card-foreground font-medium">Primary</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-secondary"></div>
              <span className="text-sm text-card-foreground font-medium">Secondary</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-accent"></div>
              <span className="text-sm text-card-foreground font-medium">Accent</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg bg-muted"></div>
              <span className="text-sm text-card-foreground font-medium">Muted</span>
            </div>
          </div>
        </motion.div>

        {/* Interactive Elements */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card-elevated p-6 rounded-xl theme-transition"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Moon className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-card-foreground">Interactive</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium">
              Primary Button
            </button>
            <button className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-all font-medium">
              Secondary Button
            </button>
            <button className="w-full px-4 py-2 drip-gradient rounded-lg hover:opacity-90 transition-all shadow-drip font-medium">
              Gradient Button
            </button>
          </div>
        </motion.div>
      </div>

      {/* Theme Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="card-elevated p-4 rounded-xl text-center border-2 border-transparent hover:border-primary/30 theme-transition"
        >
          <Sun className="w-8 h-8 mx-auto mb-2 text-accent" />
          <h4 className="font-medium text-card-foreground">Light Theme</h4>
          <p className="text-xs text-muted-foreground mt-1">Bright aqua theme</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="card-elevated p-4 rounded-xl text-center border-2 border-transparent hover:border-primary/30 theme-transition"
        >
          <Moon className="w-8 h-8 mx-auto mb-2 text-primary" />
          <h4 className="font-medium text-card-foreground">Dark Theme</h4>
          <p className="text-xs text-muted-foreground mt-1">Deep ocean theme</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="card-elevated p-4 rounded-xl text-center border-2 border-transparent hover:border-primary/30 theme-transition"
        >
          <Sunset className="w-8 h-8 mx-auto mb-2 text-accent" />
          <h4 className="font-medium text-card-foreground">Dim Theme</h4>
          <p className="text-xs text-muted-foreground mt-1">Twilight blue theme</p>
        </motion.div>
      </div>

      {/* Contrast Test */}
      <div className="card-elevated p-6 rounded-xl theme-transition">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Contrast & Readability Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-card-foreground mb-2">Text Hierarchy</h4>
            <div className="space-y-1">
              <p className="text-card-foreground font-bold">Primary Text (Bold)</p>
              <p className="text-card-foreground">Regular Text</p>
              <p className="text-muted-foreground">Muted Text</p>
              <p className="text-muted-foreground text-sm">Small Text</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-card-foreground mb-2">Background Contrast</h4>
            <div className="space-y-2">
              <div className="p-3 bg-background rounded border border-border">
                <span className="text-foreground">Background Text</span>
              </div>
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Muted Background</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeDemo