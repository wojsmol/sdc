/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind ma widzieć TYLKO pliki generatorów
  content: [
      "./src/**/*.{js,jsx,ts,tsx}",        // pages, components, hooks
    "./components/**/*.{js,jsx,ts,tsx}", // if you store components outside src

    // shadcn/ui — opcjonalne
    "./node_modules/@shadcn/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, 
  },
  plugins: [],
};
