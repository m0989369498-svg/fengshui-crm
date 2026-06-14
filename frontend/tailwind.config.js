/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // 黑金奢華主題
        ink: {
          900: '#0a0a0b',
          800: '#111114',
          700: '#17171c',
          600: '#1f1f26',
          500: '#2a2a33',
        },
        gold: {
          50: '#fbf6e9',
          100: '#f5ead0',
          200: '#ecd9a4',
          300: '#e0c577',
          400: '#d4af37',
          500: '#c8a14b',
          600: '#a8842f',
          700: '#7d611f',
        },
      },
      fontFamily: {
        // 全內網：僅用系統字體堆疊，不載外部字體
        serif: ['ui-serif', '"Noto Serif CJK TC"', '"Songti TC"', '"PMingLiU"', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '"Microsoft JhengHei"', '"PingFang TC"', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(200,161,75,0.25), 0 8px 30px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gold-line': 'linear-gradient(90deg, transparent, #c8a14b, transparent)',
      },
    },
  },
  plugins: [],
};
