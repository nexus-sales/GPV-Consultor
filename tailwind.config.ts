/**
 * Paleta corporativa
 * ---------------------------------------------------------------------------
 * La app escribe las clases de color a mano (text-gray-400, bg-indigo-600…)
 * casi 8.000 veces en 81 componentes, así que la marca no se aplica con
 * tokens nuevos: se aplica REDEFINIENDO las escalas que esas clases ya usan.
 *
 * La clave es que la paleta clara y la oscura son los dos extremos de una
 * misma rampa, no dos temas que se intercambian:
 *
 *   50 … 200  familia Cal    → fondo claro, y texto en modo oscuro
 *   300 … 600 familia Humo   → texto secundario y terciario en ambos modos
 *   700 … 950 familia Basalto→ texto en modo claro, y fondo en modo oscuro
 *
 * Como los componentes ya escriben `text-gray-900 dark:text-gray-100`, el
 * modo oscuro sale solo: en claro cogen el extremo Basalto y en oscuro el
 * extremo Cal. Por eso no hay variables que se inviertan bajo `.dark` —
 * invertirlas rompería los `dark:` que ya existen.
 *
 * Rojo, verde y ámbar NO se tocan: son señales de estado, no marca.
 */

/** Neutros: Basalto · Picón · Humo · Cal (los dos extremos de la marca) */
const neutral = {
  50: '#F0EDE6', // Cal canaria — fondo principal claro
  100: '#F2EEE6', // Basalto oscuro — texto principal en modo oscuro
  200: '#E3DFD5', // Cal alt — tarjetas y bordes en claro
  300: '#C9C1B5', // Picón oscuro — texto secundario en modo oscuro
  400: '#9A8F80', // Humo oscuro — texto terciario en modo oscuro
  500: '#7A6E63', // Humo — texto terciario en claro
  600: '#5C5147', // transición Humo → Picón
  700: '#3A322B', // Picón — texto secundario en claro, bordes en oscuro
  800: '#2A241E', // Cal alt oscuro — tarjetas en modo oscuro
  900: '#171310', // Cal oscuro — fondo principal en modo oscuro
  950: '#14100D' // Basalto volcánico — texto principal en claro
}

/** Acento: Mar (#0D4F52) y su versión aclarada para fondo oscuro (#4FBFC2) */
const mar = {
  50: '#ECF6F6',
  100: '#D2E9EA',
  200: '#A6D4D6',
  300: '#7FC9CB',
  400: '#4FBFC2', // Mar oscuro — acento sobre fondo oscuro
  500: '#1A7276',
  600: '#0D4F52', // Mar — acento y hover en claro
  700: '#0A4042',
  800: '#083133',
  900: '#062526',
  950: '#031718'
}

/** Voltio: llamada a la acción. No se aclara en oscuro — es color fijo. */
const voltio = {
  50: '#FFF9E5',
  100: '#FFF0BF',
  200: '#FFE185',
  300: '#FFD24B',
  400: '#FFC824',
  500: '#FFC300', // Voltio
  600: '#D9A600',
  700: '#A67F00',
  800: '#735800',
  900: '#4D3B00',
  950: '#2B2100'
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        // Nombres de marca, para código nuevo. Con DEFAULT para poder escribir
        // tanto `bg-voltio` como `bg-voltio-600` (hover, estados).
        basalto: neutral[950],
        picon: neutral[700],
        humo: neutral[500],
        cal: neutral[50],
        'cal-alt': neutral[200],
        mar: { ...mar, DEFAULT: mar[600] },
        voltio: { ...voltio, DEFAULT: voltio[500] },

        // Escalas remapeadas: es lo que cambia las ~8.000 clases existentes.
        gray: neutral,
        slate: neutral,
        zinc: neutral,
        neutral,
        stone: neutral,
        // `white` pasa a Cal para que el fondo claro sea el de marca y no un
        // blanco puro. Afecta a bg-white (364 usos) y text-white (543).
        white: '#F0EDE6',
        // Los acentos fríos convergen en Mar
        indigo: mar,
        blue: mar,
        cyan: mar,
        teal: mar,
        sky: mar,
        violet: mar,
        purple: mar,

        primary: 'var(--color-pastel-indigo)',
        secondary: 'var(--color-pastel-cyan)',
        warning: 'var(--color-pastel-yellow)',
        success: 'var(--color-pastel-green)',
        danger: 'var(--color-pastel-red)',
        'pastel-indigo': 'var(--color-pastel-indigo)',
        'pastel-cyan': 'var(--color-pastel-cyan)',
        'pastel-yellow': 'var(--color-pastel-yellow)',
        'pastel-green': 'var(--color-pastel-green)',
        'pastel-red': 'var(--color-pastel-red)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)',
        'pastel-indigo': '0 4px 14px 0 rgba(92, 124, 250, 0.15)',
        'pastel-cyan': '0 4px 14px 0 rgba(102, 217, 232, 0.15)',
        'pastel-yellow': '0 4px 14px 0 rgba(255, 212, 59, 0.15)',
        'pastel-green': '0 4px 14px 0 rgba(140, 233, 154, 0.15)',
        'pastel-red': '0 4px 14px 0 rgba(255, 168, 168, 0.15)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      }
    }
  },
  plugins: []
}
