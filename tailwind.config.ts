import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B4F6C',
          muted: '#4A7C8A',
        },
        surface: {
          DEFAULT: '#F7F0E8',
          alt: '#EFE6D8',
        },
        accent: {
          DEFAULT: '#D84727',
          soft: '#FDE8E2',
        },
        molt: {
          shell:  '#D84727',
          ocean:  '#0B4F6C',
          sand:   '#F7F0E8',
          coral:  '#F9B5A4',
          kelp:   '#4A7C59',
        },
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '22px',
      },
    },
  },
  plugins: [],
};

export default config;
