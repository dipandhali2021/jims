/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#fde047',
        'secondary': '#facc15',
        'accent': '#fbbf24',
        'background': '#ffffff',
        'surface': '#fafafa',
        'text': '#1e293b',
        'muted': '#64748b'
      },
      boxShadow: {
        'glow': '0 0 20px rgba(253, 224, 71, 0.3)',
        'glow-hover': '0 0 30px rgba(253, 224, 71, 0.5)'
      }
    },
  },
  plugins: [],
};