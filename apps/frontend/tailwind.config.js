/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  // Toggled on <html> by lib/theme (in-app pages only — marketing/auth pages stay light)
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        bnt: ["var(--font-bnt)"],
        mon: ["var(--font-monigue)"],
        awe: ["var(--font-awesome)"],
        mons: ["var(--font-montserrat)"],
        pop: ["var(--font-poppins)"],
        quick: ["var(--font-quicksand)"],
      },
      colors: {
        somig: "#ADE8E6",
        brco: "#FF6F61",
        mutel: "#2C7A7B",
        warber: "#FFB703",
        beige: "#F8F9FA",
        chgrey: "#343A40",
        cogrey: "#6C757D",
        // Ink, surfaces, and dividers are CSS variables (globals.css) so they flip in dark mode
        chblack: "rgb(var(--c-ink) / <alpha-value>)",
        mugrbl: "#343A40",
        // App surfaces: a quiet neutral canvas, white sheets, and hairline dividers. Brand pink is for
        // primary actions only; each hobby's own colour (lib/hobbyTheme) tints the page you're in.
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        brand: "#DB2777",
      },
      keyframes: {
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        marqueeY: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        borderRun: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        slideInLeft: "slideInLeft 2s ease-out",
        slideInRight: "slideInRight 2s ease-out",
        border: "border-run 2s linear infinite",
        // Vertical feed scroll: the list is rendered twice, so -50% loops seamlessly
        "feed-slow": "marqueeY 38s linear infinite",
        "feed-fast": "marqueeY 22s linear infinite",
      },
    },
  },
  plugins: [],
};
