/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors:{
            'primary':"#547792"
        },
        fontFamily: {
          sans: ['Outfit', 'sans-serif']
        },  
      },
    },
    plugins: [],
  }
  