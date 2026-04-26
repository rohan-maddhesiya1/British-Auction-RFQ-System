/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',        // primary text (was light, now dark)
        mist: '#f1f5f9',       // page background (was dark, now light)
        line: '#e2e8f0',       // borders
        action: '#0d9488',     // teal-600 – primary action
        warning: '#d97706',
        danger: '#e11d48',
        surface: '#ffffff',    // card/panel surface
        subtle: '#f8fafc',     // subtle off-white backgrounds
        muted: '#64748b',      // muted text (slate-500)
      },
      boxShadow: {
        panel: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        card:  '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
