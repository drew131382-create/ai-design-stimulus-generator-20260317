/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "Noto Sans SC", "sans-serif"],
      },
      colors: {
        near: {
          bg: "#f3f7fb",
          border: "#bfdbf4",
          text: "#315d85",
        },
        medium: {
          bg: "#fcf6ef",
          border: "#f0d3af",
          text: "#9a6030",
        },
        far: {
          bg: "#f7f3fb",
          border: "#d8c9eb",
          text: "#70518c",
        },
      },
    },
  },
  plugins: [],
};
