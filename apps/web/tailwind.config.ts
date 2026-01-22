import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        katsuda: {
          900: '#1B5E20',
          800: '#2E7D32',
          700: '#388E3C',
          600: '#43A047',
          500: '#4CAF50',
          400: '#66BB6A',
          300: '#81C784',
          200: '#A5D6A7',
          100: '#C8E6C9',
          50: '#E8F5E9',
        },
        accent: {
          orange: '#FF6B35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
