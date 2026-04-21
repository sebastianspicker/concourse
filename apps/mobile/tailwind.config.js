/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "var(--color-campus-bg)",
          surface: "var(--color-campus-surface)",
          text: "var(--color-campus-text)",
          muted: "var(--color-campus-muted)",
          accent: "var(--color-campus-accent)",
          error: "var(--color-campus-error)",
          success: "var(--color-campus-success)",
          warning: "var(--color-campus-warning)",
          info: "var(--color-campus-info)",
        },
      },
      borderRadius: {
        campus: "12px",
        "campus-lg": "20px",
      },
    },
  },
  plugins: [],
};
