/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS Variable Integration
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // DRIPPY Brand Colors - Dynamic with themes
        'drippy-cyan': 'hsl(var(--drippy-cyan))',
        'drippy-navy': 'hsl(var(--drippy-navy))',
        'drippy-yellow': 'hsl(var(--drippy-yellow))',
        'drippy-red': 'hsl(var(--drippy-red))',
        
        // Static Brand Colors for consistency
        brand: {
          cyan: {
            50: '#e6ffff',
            100: '#b3ffff',
            200: '#80ffff',
            300: '#4dffff',
            400: '#1affff',
            500: '#00e6e6', // Main logo cyan
            600: '#00cccc',
            700: '#00b3b3',
            800: '#009999',
            900: '#008080',
          },
          navy: {
            50: '#f0f4f8',
            100: '#d9e6f2',
            200: '#b3ccdc',
            300: '#8db3c6',
            400: '#6799b0',
            500: '#41809a',
            600: '#1b6684',
            700: '#164d6e', // Logo navy
            800: '#113358',
            900: '#0c1a42',
          },
          yellow: {
            50: '#fffef0',
            100: '#fffde0',
            200: '#fffac2',
            300: '#fff7a3',
            400: '#fff485',
            500: '#ffd700', // Logo yellow
            600: '#e6c200',
            700: '#ccad00',
            800: '#b39900',
            900: '#998500',
          },
          red: {
            50: '#fff0f0',
            100: '#ffe0e0',
            200: '#ffc2c2',
            300: '#ffa3a3',
            400: '#ff8585',
            500: '#ff6666', // Logo red
            600: '#e60000',
            700: '#cc0000',
            800: '#b30000',
            900: '#990000',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'drip': 'drip 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'theme-transition': 'themeTransition 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        drip: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px hsl(var(--drippy-cyan) / 0.5)' },
          '100%': { boxShadow: '0 0 20px hsl(var(--drippy-cyan) / 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        themeTransition: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'drip': '0 4px 20px hsl(var(--drippy-cyan) / 0.3)',
        'drip-lg': '0 8px 40px hsl(var(--drippy-cyan) / 0.4)',
        'glow': '0 0 20px hsl(var(--drippy-cyan) / 0.5)',
        'glow-lg': '0 0 40px hsl(var(--drippy-cyan) / 0.6)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
