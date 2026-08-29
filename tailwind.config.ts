import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFEB',
        bg: '#FFFFEB',
        primary: {
          DEFAULT: '#034F46',
          hover: '#023D36',
        },
        'primary-hover': '#023D36',
        ink: '#1A1A1A',
        text: {
          DEFAULT: '#1A1A1A',
          muted: '#5A5A52',
        },
        muted: '#5A5A52',
        hairline: '#E8E4C9',
        border: '#E8E4C9',
        card: '#FBF9DE',
        'card-bg': '#FBF9DE',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
