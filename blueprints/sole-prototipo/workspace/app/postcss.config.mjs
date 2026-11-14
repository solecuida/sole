// Tailwind v4 vía PostCSS: el build usa `next build --webpack` (lo exige @serwist/next),
// y con webpack el cargador de Turbopack no hace nada.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
