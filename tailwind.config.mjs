/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				brand: {
					red: '#f97316',    // Primary: Orange-500
					yellow: '#fdba74', // Secondary: Orange-300
					accent: '#3b82f6', // Accent: Blue-500
					dark: '#0f172a',   // Background: Slate-900 (Navy)
					light: '#f8fafc',  // Text: Slate-50
					gray: '#334155',   // Muted: Slate-700
				}
			}
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
