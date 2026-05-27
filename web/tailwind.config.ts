import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          50: '#FFF8DC',
          100: '#FFF0B8',
          200: '#F5DEB3',
          300: '#D2B48C',
          400: '#C4A265',
          500: '#A0785A',
          600: '#8B6914',
          700: '#6F4E37',
          800: '#5C3D2E',
          900: '#3E2723',
        },
      },
    },
  },
  plugins: [],
};

export default config;
