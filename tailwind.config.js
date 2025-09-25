import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,vue,ts}'],

	theme: {
		extend: {}
	},

	plugins: [typography, forms]
};
