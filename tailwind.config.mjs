/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				brand: {
					orange: {
						DEFAULT: '#f97316',
						50: '#fff7ed',
						100: '#ffedd5',
						200: '#fed7aa',
						300: '#fdba74',
						400: '#fb923c',
						500: '#f97316',
						600: '#ea580c',
						700: '#c2410c',
						800: '#9a3412',
						900: '#7c2d12',
						950: '#431407',
					},
					navy: {
						DEFAULT: '#0f172a', // Slate-900
						900: '#0f172a',
						800: '#1e293b', // Slate-800
					},
					blue: '#3b82f6',   // Blue-500
					slate: {
						50: '#f8fafc',
						700: '#334155',
					}
				}
			}
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
