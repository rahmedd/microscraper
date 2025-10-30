import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import pluginJest from 'eslint-plugin-jest'

export default [
	eslint.configs.recommended,
	...tsEslint.configs.recommended,
	{
		ignores: ['**/dist'],
	},
	{
		plugins: {
			'@stylistic': stylistic,
			jest: pluginJest,
		},
		languageOptions: {
			globals: pluginJest.environments.globals.globals,
		},
		files: ['**/*.{ts,tsx,js,jsx,vue}'],
		rules: {
			// stylistic
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/quotes': [
				'error',
				'single',
				{ allowTemplateLiterals: 'always', avoidEscape: true },
			],
			'@stylistic/brace-style': ['error', 'stroustrup'],
			'@stylistic/semi': ['error', 'never'],

			// TypeScript-ESLint tweaks
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		rules: {
			// add/override rules here
		},
	},
]
