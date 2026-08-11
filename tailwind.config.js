/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{vue,js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			spacing: {
				0.5: "0.125rem",
				1.25: "0.3125rem",
				1.75: "0.4375rem",
				2.25: "0.5625rem",
				2.75: "0.6875rem",
				3.75: "0.9375rem",
				4.5: "1.125rem",
				5.5: "1.375rem",
				6.5: "1.625rem",
				7: "1.75rem",
				9: "2.25rem",
				9.5: "2.375rem",
				10.5: "2.625rem",
				11: "2.75rem",
				12.5: "3.125rem",
				14: "3.5rem",
			},
			zIndex: {
				100: "100",
				200: "200",
			},
			borderRadius: {
				1: "0.25rem",
				1.75: "0.4375rem",
				2: "0.5rem",
				3.5: "0.875rem",
				4.5: "1.125rem",
			},
			fontSize: {
				2.75: "0.6875rem",
				3.25: "0.8125rem",
				3.5: "0.875rem",
			},
			animation: {
				pulse:
					"pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
			},
		},
	},
	plugins: [],
};
